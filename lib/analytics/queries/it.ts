import "server-only";
import { query } from "@/lib/db";
import { createdInRange, nairobi } from "@/lib/reports/sql";
import { MONTHS, daysBetween, nairobiMonth } from "@/lib/analytics/sql";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { ItAnalytics, ItStage } from "@/lib/analytics/types";

// IT Requisition analytics. Every query takes $1 from, $2 to (inclusive
// Nairobi submission dates) and $3 department ('' = all).

// Outcomes follow the IT report: accepted once IT accepts, declined when
// the HOD declines or IT rejects (older rows say 'approved'/'declined' for
// IT), otherwise pending. The open stage is the one a pending request waits
// on, or the one that declined it.
const IT_ACCEPTED = `r.it_approver_status IN ('accepted', 'approved')`;
const IT_REJECTED = `r.it_approver_status IN ('rejected', 'declined')`;

const REQUESTS = `
  req AS (
    SELECT
      r.*,
      CASE
        WHEN ${IT_ACCEPTED} THEN 'accepted'
        WHEN r.hod_approver_status = 'declined' OR ${IT_REJECTED} THEN 'declined'
        ELSE 'pending'
      END AS outcome,
      CASE
        WHEN r.hod_approver_status <> 'approved' THEN 'hod'
        WHEN NOT ${IT_ACCEPTED} THEN 'it'
      END AS open_stage
    FROM it_requisitions r
    WHERE ${createdInRange("r.request_created_at")}
      AND ($3 = '' OR r.employee_department = $3)
  )`;

const WITH = `WITH ${REQUESTS}`;
const ACCEPTED = `outcome = 'accepted'`;

const TOTALS_SQL = `${WITH}
  SELECT
    COUNT(*)::int AS requests,
    COUNT(*) FILTER (WHERE replacement_new = 'New')::int AS new_hires,
    COUNT(*) FILTER (WHERE replacement_new = 'Replacement')::int AS replacements,
    COUNT(*) FILTER (WHERE ${ACCEPTED})::int AS accepted_requests,
    COUNT(*) FILTER (WHERE outcome = 'pending')::int AS pending_requests,
    COUNT(*) FILTER (WHERE outcome = 'declined')::int AS declined_requests,
    COUNT(*) FILTER (
      WHERE ${ACCEPTED}
        AND ${nairobi("it_approval_date")}::date <= date_joining
    )::int AS accepted_before_joining,
    AVG(date_joining - ${nairobi("request_created_at")}::date)::float8 AS avg_notice_days,
    (AVG(${daysBetween("request_created_at", "it_approval_date")})
       FILTER (WHERE outcome <> 'pending' AND it_approval_date IS NOT NULL))::float8
      AS avg_days_to_it_decision,
    COUNT(*) FILTER (WHERE ${ACCEPTED} AND completion_status = 'completed')::int
      AS completed
  FROM req`;

const MONTHLY_SQL = `${WITH}, ${MONTHS}
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COUNT(q.request_id)::int AS requested,
    COUNT(q.request_id) FILTER (WHERE q.${ACCEPTED})::int AS accepted
  FROM months m
  LEFT JOIN req q ON ${nairobiMonth("q.request_created_at")} = m.month
  GROUP BY m.month
  ORDER BY m.month`;

const BY_DEPARTMENT_SQL = `${WITH}
  SELECT
    employee_department AS department,
    COUNT(*) FILTER (WHERE ${ACCEPTED})::int AS accepted,
    COUNT(*) FILTER (WHERE outcome = 'pending')::int AS pending
  FROM req
  GROUP BY employee_department
  HAVING COUNT(*) FILTER (WHERE outcome IN ('accepted', 'pending')) > 0
  ORDER BY accepted DESC, pending DESC, department`;

// it_requisitions.requirements stores the ticked items joined with commas
// (item names can't contain one), so they split back apart cleanly
const REQUIREMENT_ITEMS_SQL = `${WITH}
  SELECT TRIM(item) AS item, COUNT(*)::int AS requests
  FROM req, REGEXP_SPLIT_TO_TABLE(requirements, ',') AS item
  WHERE ${ACCEPTED} AND TRIM(item) <> ''
  GROUP BY TRIM(item)
  ORDER BY requests DESC, item`;

const REPLACEMENT_OR_NEW_SQL = `${WITH}
  SELECT replacement_new AS kind, COUNT(*)::int AS requests
  FROM req WHERE ${ACCEPTED}
  GROUP BY replacement_new
  ORDER BY replacement_new`;

const BY_STAGE_SQL = `${WITH}
  SELECT outcome, open_stage AS stage, COUNT(*)::int AS requests
  FROM req
  WHERE outcome IN ('pending', 'declined') AND open_stage IS NOT NULL
  GROUP BY outcome, open_stage`;

const STAGE_ORDER: ItStage[] = ["hod", "it"];

export async function loadItAnalytics({
  from,
  to,
  department,
}: AnalyticsFilters): Promise<ItAnalytics> {
  const params = [from, to, department];

  const [
    totalsRows,
    monthly,
    byDepartment,
    requirementItems,
    replacementOrNew,
    byStage,
  ] = await Promise.all([
    query<{
      requests: number;
      new_hires: number;
      replacements: number;
      accepted_requests: number;
      pending_requests: number;
      declined_requests: number;
      accepted_before_joining: number;
      avg_notice_days: number | null;
      avg_days_to_it_decision: number | null;
      completed: number;
    }>(TOTALS_SQL, params),
    query<{ month: string; requested: number; accepted: number }>(
      MONTHLY_SQL,
      params,
    ),
    query<{ department: string; accepted: number; pending: number }>(
      BY_DEPARTMENT_SQL,
      params,
    ),
    query<{ item: string; requests: number }>(REQUIREMENT_ITEMS_SQL, params),
    query<{ kind: string; requests: number }>(REPLACEMENT_OR_NEW_SQL, params),
    query<{
      outcome: "pending" | "declined";
      stage: ItStage;
      requests: number;
    }>(BY_STAGE_SQL, params),
  ]);

  const totals = totalsRows[0];
  const stageRows = (outcome: "pending" | "declined") =>
    STAGE_ORDER.flatMap((stage) =>
      byStage
        .filter((row) => row.outcome === outcome && row.stage === stage)
        .map(({ requests }) => ({ stage, requests })),
    );

  return {
    totals: {
      requests: totals.requests,
      newHires: totals.new_hires,
      replacements: totals.replacements,
      acceptedRequests: totals.accepted_requests,
      pendingRequests: totals.pending_requests,
      declinedRequests: totals.declined_requests,
      acceptedBeforeJoining: totals.accepted_before_joining,
      avgNoticeDays: totals.avg_notice_days,
      avgDaysToItDecision: totals.avg_days_to_it_decision,
      completed: totals.completed,
    },
    monthly,
    byDepartment,
    requirementItems,
    replacementOrNew,
    pipeline: stageRows("pending"),
    declines: stageRows("declined"),
  };
}
