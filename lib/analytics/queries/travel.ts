import "server-only";
import { query } from "@/lib/db";
import { createdInRange } from "@/lib/reports/sql";
import { MONTHS, daysBetween, nairobiMonth } from "@/lib/analytics/sql";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { TravelAnalytics, TravelStage } from "@/lib/analytics/types";

// Travel Requisition analytics. Every query takes $1 from, $2 to
// (inclusive Nairobi submission dates) and $3 department ('' = all).

// One row per trip in range. Outcomes follow the Travel report: declined
// when any stage declined, pending while any is pending, otherwise approved
// — 'N/A' counts as done (Director outside Tier 3, and HR on Tier 1 trips
// from before HR became mandatory). The open stage is the first one that
// isn't done: the one a pending trip waits on, or the one that declined it.
// An amendment restarts the chain, so turnaround counts from it.
const TRIPS = `
  trip AS (
    SELECT
      r.*,
      CASE
        WHEN 'declined' IN (r.travel_hod_approval_status,
                            r.travel_hr_approval_status,
                            r.travel_director_approval_status) THEN 'declined'
        WHEN 'pending' IN (r.travel_hod_approval_status,
                           r.travel_hr_approval_status,
                           r.travel_director_approval_status) THEN 'pending'
        ELSE 'approved'
      END AS outcome,
      CASE
        WHEN r.travel_hod_approval_status NOT IN ('approved', 'N/A') THEN 'hod'
        WHEN r.travel_hr_approval_status NOT IN ('approved', 'N/A') THEN 'hr'
        WHEN r.travel_director_approval_status NOT IN ('approved', 'N/A') THEN 'director'
      END AS open_stage,
      GREATEST(r.travel_hod_approval_date,
               r.travel_hr_approval_date,
               r.travel_director_approval_date) AS decided_at,
      COALESCE(r.last_amended_at, r.request_created_at) AS chain_started_at
    FROM travel_requisitions r
    WHERE ${createdInRange("r.request_created_at")}
      AND ($3 = '' OR r.employee_department = $3)
  )`;

const WITH = `WITH ${TRIPS}`;

const APPROVED = `outcome = 'approved'`;

const TOTALS_SQL = `${WITH}
  SELECT
    COUNT(*)::int AS trips,
    COALESCE(SUM(travel_total_cost), 0)::float8 AS requested_spend,
    COUNT(*) FILTER (WHERE ${APPROVED})::int AS approved_trips,
    COALESCE(SUM(travel_total_cost) FILTER (WHERE ${APPROVED}), 0)::float8 AS approved_spend,
    COUNT(*) FILTER (WHERE outcome = 'pending')::int AS pending_trips,
    COALESCE(SUM(travel_total_cost) FILTER (WHERE outcome = 'pending'), 0)::float8
      AS pending_spend,
    COUNT(*) FILTER (WHERE outcome = 'declined')::int AS declined_trips,
    (AVG(travel_total_cost) FILTER (WHERE ${APPROVED}))::float8 AS avg_approved_cost,
    COUNT(*) FILTER (WHERE ${APPROVED} AND travel_within_budget = 'Yes')::int
      AS approved_within_budget,
    (AVG(${daysBetween("chain_started_at", "decided_at")})
       FILTER (WHERE outcome <> 'pending' AND decided_at IS NOT NULL))::float8
      AS avg_days_to_decision,
    COALESCE(SUM(travel_hr_pushback_count), 0)::int AS pushbacks,
    COUNT(*) FILTER (WHERE amendment_count > 0)::int AS amended_trips,
    COALESCE(SUM(travel_transport_cost) FILTER (WHERE ${APPROVED}), 0)::float8 AS transport,
    COALESCE(SUM(travel_per_diem) FILTER (WHERE ${APPROVED}), 0)::float8 AS per_diem,
    COALESCE(SUM(travel_other_costs) FILTER (WHERE ${APPROVED}), 0)::float8 AS other
  FROM trip`;

const MONTHLY_SQL = `${WITH}, ${MONTHS}
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COALESCE(SUM(t.travel_total_cost), 0)::float8 AS requested_spend,
    COALESCE(SUM(t.travel_total_cost) FILTER (WHERE t.${APPROVED}), 0)::float8
      AS approved_spend
  FROM months m
  LEFT JOIN trip t ON ${nairobiMonth("t.request_created_at")} = m.month
  GROUP BY m.month
  ORDER BY m.month`;

const BY_DEPARTMENT_SQL = `${WITH}
  SELECT
    employee_department AS department,
    COALESCE(SUM(travel_total_cost) FILTER (WHERE ${APPROVED}), 0)::float8 AS approved_spend,
    COALESCE(SUM(travel_total_cost) FILTER (WHERE outcome = 'pending'), 0)::float8
      AS pending_spend
  FROM trip
  GROUP BY employee_department
  HAVING COUNT(*) FILTER (WHERE outcome IN ('approved', 'pending')) > 0
  ORDER BY approved_spend DESC, pending_spend DESC, department`;

const BY_TIER_SQL = `${WITH}
  SELECT
    travel_approval_tier AS tier,
    COUNT(*)::int AS trips,
    COUNT(*) FILTER (WHERE ${APPROVED})::int AS approved_trips,
    COALESCE(SUM(travel_total_cost) FILTER (WHERE ${APPROVED}), 0)::float8 AS approved_spend
  FROM trip
  GROUP BY travel_approval_tier
  ORDER BY travel_approval_tier`;

const BY_MODE_SQL = `${WITH}
  SELECT travel_mode AS mode, COUNT(*)::int AS trips
  FROM trip WHERE ${APPROVED}
  GROUP BY travel_mode
  ORDER BY trips DESC, mode`;

const BY_CATEGORY_SQL = `${WITH}
  SELECT travel_category AS category, COUNT(*)::int AS trips
  FROM trip WHERE ${APPROVED}
  GROUP BY travel_category
  ORDER BY trips DESC, category`;

// Destinations are free text, so trimmed and grouped case-insensitively,
// shown as their most common spelling
const TOP_DESTINATIONS_SQL = `${WITH}
  SELECT
    MODE() WITHIN GROUP (ORDER BY TRIM(travel_destination)) AS destination,
    COUNT(*)::int AS trips,
    SUM(travel_total_cost)::float8 AS spend
  FROM trip WHERE ${APPROVED}
  GROUP BY LOWER(TRIM(travel_destination))
  ORDER BY spend DESC, trips DESC
  LIMIT 8`;

const BY_STAGE_SQL = `${WITH}
  SELECT outcome, open_stage AS stage,
         COUNT(*)::int AS trips,
         COALESCE(SUM(travel_total_cost), 0)::float8 AS spend
  FROM trip
  WHERE outcome IN ('pending', 'declined') AND open_stage IS NOT NULL
  GROUP BY outcome, open_stage`;

const LARGEST_APPROVED_SQL = `${WITH}
  SELECT
    request_id,
    employee_name,
    employee_department AS department,
    travel_destination AS destination,
    TO_CHAR(travel_departure_date, 'YYYY-MM-DD') AS departure_date,
    travel_approval_tier AS tier,
    travel_total_cost::float8 AS total_cost
  FROM trip WHERE ${APPROVED}
  ORDER BY travel_total_cost DESC, travel_departure_date DESC
  LIMIT 8`;

const STAGE_ORDER: TravelStage[] = ["hod", "hr", "director"];

export async function loadTravelAnalytics({
  from,
  to,
  department,
}: AnalyticsFilters): Promise<TravelAnalytics> {
  const params = [from, to, department];

  const [
    totalsRows,
    monthly,
    byDepartment,
    byTier,
    byMode,
    byCategory,
    topDestinations,
    byStage,
    largest,
  ] = await Promise.all([
    query<{
      trips: number;
      requested_spend: number;
      approved_trips: number;
      approved_spend: number;
      pending_trips: number;
      pending_spend: number;
      declined_trips: number;
      avg_approved_cost: number | null;
      approved_within_budget: number;
      avg_days_to_decision: number | null;
      pushbacks: number;
      amended_trips: number;
      transport: number;
      per_diem: number;
      other: number;
    }>(TOTALS_SQL, params),
    query<{ month: string; requested_spend: number; approved_spend: number }>(
      MONTHLY_SQL,
      params,
    ),
    query<{
      department: string;
      approved_spend: number;
      pending_spend: number;
    }>(BY_DEPARTMENT_SQL, params),
    query<{
      tier: string;
      trips: number;
      approved_trips: number;
      approved_spend: number;
    }>(BY_TIER_SQL, params),
    query<{ mode: string; trips: number }>(BY_MODE_SQL, params),
    query<{ category: string; trips: number }>(BY_CATEGORY_SQL, params),
    query<{ destination: string; trips: number; spend: number }>(
      TOP_DESTINATIONS_SQL,
      params,
    ),
    query<{
      outcome: "pending" | "declined";
      stage: TravelStage;
      trips: number;
      spend: number;
    }>(BY_STAGE_SQL, params),
    query<{
      request_id: string;
      employee_name: string;
      department: string;
      destination: string;
      departure_date: string;
      tier: string;
      total_cost: number;
    }>(LARGEST_APPROVED_SQL, params),
  ]);

  const totals = totalsRows[0];
  const stageRows = (outcome: "pending" | "declined") =>
    STAGE_ORDER.flatMap((stage) =>
      byStage.filter((row) => row.outcome === outcome && row.stage === stage),
    );

  return {
    totals: {
      trips: totals.trips,
      requestedSpend: totals.requested_spend,
      approvedTrips: totals.approved_trips,
      approvedSpend: totals.approved_spend,
      pendingTrips: totals.pending_trips,
      pendingSpend: totals.pending_spend,
      declinedTrips: totals.declined_trips,
      avgApprovedCost: totals.avg_approved_cost,
      approvedWithinBudget: totals.approved_within_budget,
      avgDaysToDecision: totals.avg_days_to_decision,
      pushbacks: totals.pushbacks,
      amendedTrips: totals.amended_trips,
    },
    approvedCostParts: {
      transport: totals.transport,
      perDiem: totals.per_diem,
      other: totals.other,
    },
    monthly: monthly.map((row) => ({
      month: row.month,
      requestedSpend: row.requested_spend,
      approvedSpend: row.approved_spend,
    })),
    byDepartment: byDepartment.map((row) => ({
      department: row.department,
      approvedSpend: row.approved_spend,
      pendingSpend: row.pending_spend,
    })),
    byTier: byTier.map((row) => ({
      tier: row.tier,
      trips: row.trips,
      approvedTrips: row.approved_trips,
      approvedSpend: row.approved_spend,
    })),
    byMode,
    byCategory,
    topDestinations,
    pipeline: stageRows("pending").map(({ stage, trips, spend }) => ({
      stage,
      trips,
      spend,
    })),
    declines: stageRows("declined").map(({ stage, trips }) => ({
      stage,
      trips,
    })),
    largestApproved: largest.map((row) => ({
      requestId: row.request_id,
      employeeName: row.employee_name,
      department: row.department,
      destination: row.destination,
      departureDate: row.departure_date,
      tier: row.tier,
      totalCost: row.total_cost,
    })),
  };
}
