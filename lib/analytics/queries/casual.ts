import "server-only";
import { query } from "@/lib/db";
import { createdInRange } from "@/lib/reports/sql";
import { MONTHS, daysBetween, nairobiMonth } from "@/lib/analytics/sql";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type {
  CasualAnalytics,
  CasualBudget,
  CasualStage,
} from "@/lib/analytics/types";

// Casual Requisition analytics: HOD -> HR. A requisition is approved once
// HR approves, declined when either stage declines, otherwise pending.

const OUTCOME = (alias: string) => `CASE
    WHEN 'declined' IN (${alias}.casual_hod_approval_status, ${alias}.casual_hr_approval_status)
      THEN 'declined'
    WHEN ${alias}.casual_hod_approval_status = 'approved'
     AND ${alias}.casual_hr_approval_status = 'approved' THEN 'approved'
    ELSE 'pending'
  END`;

// ─── Submission-range dashboard ──────────────────────────────────────────────
// $1 from, $2 to (inclusive Nairobi submission dates), $3 department ('' = all)

// One row per requisition in range. The open stage is the one a pending
// requisition waits on, or the one that declined it. An amendment restarts
// the chain, so turnaround counts from it.
const REQUISITIONS = `
  req AS (
    SELECT
      c.*,
      ${OUTCOME("c")} AS outcome,
      CASE
        WHEN c.casual_hod_approval_status <> 'approved' THEN 'hod'
        WHEN c.casual_hr_approval_status <> 'approved' THEN 'hr'
      END AS open_stage,
      GREATEST(c.casual_hod_approval_date, c.casual_hr_approval_date) AS decided_at,
      COALESCE(c.last_amended_at, c.request_created_at) AS chain_started_at
    FROM casual_requisitions c
    WHERE ${createdInRange("c.request_created_at")}
      AND ($3 = '' OR c.employee_department = $3)
  )`;

const SECTIONS = `
  sec AS (
    SELECT
      s.*,
      req.outcome,
      req.employee_department,
      req.casual_location,
      req.casual_category,
      req.request_created_at,
      s.number_of_casuals * s.engagement_days AS casual_days
    FROM casual_requisition_sections s
    JOIN req ON req.request_id = s.request_id
  )`;

const WITH = `WITH ${REQUISITIONS}, ${SECTIONS}`;
const APPROVED = `outcome = 'approved'`;

const TOTALS_SQL = `${WITH}
  SELECT
    (SELECT COUNT(*) FROM req)::int AS requisitions,
    (SELECT COUNT(*) FROM req WHERE ${APPROVED})::int AS approved_requisitions,
    (SELECT COUNT(*) FROM req WHERE outcome = 'pending')::int AS pending_requisitions,
    (SELECT COUNT(*) FROM req WHERE outcome = 'declined')::int AS declined_requisitions,
    (SELECT COUNT(*) FROM req WHERE amendment_count > 0)::int AS amended_requisitions,
    (SELECT AVG(${daysBetween("chain_started_at", "decided_at")})
       FROM req WHERE outcome <> 'pending' AND decided_at IS NOT NULL)::float8
      AS avg_days_to_decision,
    COALESCE(SUM(number_of_casuals), 0)::int AS casuals_requested,
    COALESCE(SUM(casual_total_amount), 0)::float8 AS requested_amount,
    COALESCE(SUM(number_of_casuals) FILTER (WHERE ${APPROVED}), 0)::int AS approved_casuals,
    COALESCE(SUM(casual_days) FILTER (WHERE ${APPROVED}), 0)::int AS approved_casual_days,
    COALESCE(SUM(casual_total_amount) FILTER (WHERE ${APPROVED}), 0)::float8 AS approved_amount,
    COALESCE(SUM(casual_total_amount) FILTER (WHERE outcome = 'pending'), 0)::float8
      AS pending_amount
  FROM sec`;

const MONTHLY_SQL = `${WITH}, ${MONTHS}
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COALESCE(SUM(s.casual_total_amount), 0)::float8 AS requested_amount,
    COALESCE(SUM(s.casual_total_amount) FILTER (WHERE s.${APPROVED}), 0)::float8
      AS approved_amount
  FROM months m
  LEFT JOIN sec s ON ${nairobiMonth("s.request_created_at")} = m.month
  GROUP BY m.month
  ORDER BY m.month`;

const BY_DEPARTMENT_SQL = `${WITH}
  SELECT
    employee_department AS department,
    COALESCE(SUM(casual_total_amount) FILTER (WHERE ${APPROVED}), 0)::float8 AS approved_amount,
    COALESCE(SUM(casual_total_amount) FILTER (WHERE outcome = 'pending'), 0)::float8
      AS pending_amount
  FROM sec
  GROUP BY employee_department
  HAVING COUNT(*) FILTER (WHERE outcome IN ('approved', 'pending')) > 0
  ORDER BY approved_amount DESC, pending_amount DESC, department`;

const BY_LOCATION_SQL = `${WITH}
  SELECT casual_location AS location,
         SUM(casual_days)::int AS casual_days,
         SUM(casual_total_amount)::float8 AS amount
  FROM sec WHERE ${APPROVED}
  GROUP BY casual_location
  ORDER BY amount DESC, location`;

const BY_CATEGORY_SQL = `${WITH}
  SELECT COALESCE(casual_category, 'No category') AS category,
         SUM(casual_days)::int AS casual_days,
         SUM(casual_total_amount)::float8 AS amount
  FROM sec WHERE ${APPROVED}
  GROUP BY COALESCE(casual_category, 'No category')
  ORDER BY amount DESC, category`;

const TOP_SECTIONS_SQL = `${WITH}
  SELECT section_name AS section,
         employee_department AS department,
         SUM(casual_days)::int AS casual_days,
         SUM(casual_total_amount)::float8 AS amount
  FROM sec WHERE ${APPROVED}
  GROUP BY section_name, employee_department
  ORDER BY amount DESC, section
  LIMIT 8`;

const BY_STAGE_SQL = `${WITH},
  req_amount AS (
    SELECT request_id, SUM(casual_total_amount) AS amount FROM sec GROUP BY request_id
  )
  SELECT req.outcome, req.open_stage AS stage,
         COUNT(*)::int AS requisitions,
         COALESCE(SUM(ra.amount), 0)::float8 AS amount
  FROM req LEFT JOIN req_amount ra ON ra.request_id = req.request_id
  WHERE req.outcome IN ('pending', 'declined') AND req.open_stage IS NOT NULL
  GROUP BY req.outcome, req.open_stage`;

const STAGE_ORDER: CasualStage[] = ["hod", "hr"];

export async function loadCasualAnalytics({
  from,
  to,
  department,
}: AnalyticsFilters): Promise<CasualAnalytics> {
  const params = [from, to, department];

  const [
    totalsRows,
    monthly,
    byDepartment,
    byLocation,
    byCategory,
    topSections,
    byStage,
  ] = await Promise.all([
    query<{
      requisitions: number;
      approved_requisitions: number;
      pending_requisitions: number;
      declined_requisitions: number;
      amended_requisitions: number;
      avg_days_to_decision: number | null;
      casuals_requested: number;
      requested_amount: number;
      approved_casuals: number;
      approved_casual_days: number;
      approved_amount: number;
      pending_amount: number;
    }>(TOTALS_SQL, params),
    query<{ month: string; requested_amount: number; approved_amount: number }>(
      MONTHLY_SQL,
      params,
    ),
    query<{
      department: string;
      approved_amount: number;
      pending_amount: number;
    }>(BY_DEPARTMENT_SQL, params),
    query<{ location: string; casual_days: number; amount: number }>(
      BY_LOCATION_SQL,
      params,
    ),
    query<{ category: string; casual_days: number; amount: number }>(
      BY_CATEGORY_SQL,
      params,
    ),
    query<{
      section: string;
      department: string;
      casual_days: number;
      amount: number;
    }>(TOP_SECTIONS_SQL, params),
    query<{
      outcome: "pending" | "declined";
      stage: CasualStage;
      requisitions: number;
      amount: number;
    }>(BY_STAGE_SQL, params),
  ]);

  const totals = totalsRows[0];
  const stageRows = (outcome: "pending" | "declined") =>
    STAGE_ORDER.flatMap((stage) =>
      byStage.filter((row) => row.outcome === outcome && row.stage === stage),
    );

  return {
    totals: {
      requisitions: totals.requisitions,
      casualsRequested: totals.casuals_requested,
      requestedAmount: totals.requested_amount,
      approvedRequisitions: totals.approved_requisitions,
      approvedCasuals: totals.approved_casuals,
      approvedCasualDays: totals.approved_casual_days,
      approvedAmount: totals.approved_amount,
      pendingRequisitions: totals.pending_requisitions,
      pendingAmount: totals.pending_amount,
      declinedRequisitions: totals.declined_requisitions,
      avgDailyRate:
        totals.approved_casual_days > 0
          ? totals.approved_amount / totals.approved_casual_days
          : null,
      avgDaysToDecision: totals.avg_days_to_decision,
      amendedRequisitions: totals.amended_requisitions,
    },
    monthly: monthly.map((row) => ({
      month: row.month,
      requestedAmount: row.requested_amount,
      approvedAmount: row.approved_amount,
    })),
    byDepartment: byDepartment.map((row) => ({
      department: row.department,
      approvedAmount: row.approved_amount,
      pendingAmount: row.pending_amount,
    })),
    byLocation: byLocation.map((row) => ({
      location: row.location,
      casualDays: row.casual_days,
      amount: row.amount,
    })),
    byCategory: byCategory.map((row) => ({
      category: row.category,
      casualDays: row.casual_days,
      amount: row.amount,
    })),
    topSections: topSections.map((row) => ({
      section: row.section,
      department: row.department,
      casualDays: row.casual_days,
      amount: row.amount,
    })),
    pipeline: stageRows("pending").map(({ stage, requisitions, amount }) => ({
      stage,
      requisitions,
      amount,
    })),
    declines: stageRows("declined").map(({ stage, requisitions }) => ({
      stage,
      requisitions,
    })),
  };
}

// ─── Budget for a financial year ─────────────────────────────────────────────
// $1 financial year ('2026-2027'), $2 department ('' = all)

// The year's months, April first, and each section's spend in the month its
// engagement starts, statutory costs included — as GetCasualBudgetEstimate
// counts it. Spend is grouped by its requisition's outcome.
const FY = `
  fy AS (
    SELECT MAKE_DATE(SPLIT_PART($1::text, '-', 1)::int, 4, 1) AS starts_on,
           MAKE_DATE(SPLIT_PART($1::text, '-', 2)::int, 3, 31) AS ends_on
  ),
  fy_months AS (
    SELECT generate_series(fy.starts_on, fy.ends_on, INTERVAL '1 month')::date AS month
    FROM fy
  ),
  spend AS (
    SELECT
      c.employee_department AS department,
      DATE_TRUNC('month', s.engagement_period_from)::date AS month,
      ${OUTCOME("c")} AS outcome,
      s.casual_total_amount
        + s.number_of_casuals * COALESCE(sc.statutory_cost_per_casual, 0) AS amount
    FROM casual_requisition_sections s
    JOIN casual_requisitions c ON c.request_id = s.request_id
    CROSS JOIN fy
    LEFT JOIN casual_department_statutory_costs sc
      ON sc.department_name = c.employee_department AND sc.financial_year = $1
    WHERE s.engagement_period_from BETWEEN fy.starts_on AND fy.ends_on
      AND ($2 = '' OR c.employee_department = $2)
  ),
  budget AS (
    SELECT
      b.department_name AS department,
      MAKE_DATE(SPLIT_PART($1::text, '-', CASE WHEN b.budget_month >= 4 THEN 1 ELSE 2 END)::int,
                b.budget_month, 1) AS month,
      b.budget_amount AS amount
    FROM casual_department_budgets b
    WHERE b.financial_year = $1
      AND ($2 = '' OR b.department_name = $2)
  )`;

const BUDGET_MONTHLY_SQL = `WITH ${FY}
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COALESCE((SELECT SUM(amount) FROM budget b WHERE b.month = m.month), 0)::float8 AS budget,
    COALESCE((SELECT SUM(amount) FROM spend s
              WHERE s.month = m.month AND s.outcome = 'approved'), 0)::float8 AS approved_spend,
    COALESCE((SELECT SUM(amount) FROM spend s
              WHERE s.month = m.month AND s.outcome = 'pending'), 0)::float8 AS pending_spend
  FROM fy_months m
  ORDER BY m.month`;

const BUDGET_BY_DEPARTMENT_SQL = `WITH ${FY},
  baseline AS (
    SELECT department_name AS department, SUM(baseline_amount) AS amount
    FROM casual_department_baseline_spend
    WHERE financial_year = $1 AND ($2 = '' OR department_name = $2)
    GROUP BY department_name
  ),
  departments AS (
    SELECT department FROM budget
    UNION SELECT department FROM baseline
    UNION SELECT department FROM spend WHERE outcome IN ('approved', 'pending')
  )
  SELECT
    d.department,
    COALESCE((SELECT SUM(amount) FROM budget b WHERE b.department = d.department), 0)::float8
      AS budget,
    COALESCE((SELECT amount FROM baseline bl WHERE bl.department = d.department), 0)::float8
      AS baseline,
    COALESCE((SELECT SUM(amount) FROM spend s
              WHERE s.department = d.department AND s.outcome = 'approved'), 0)::float8
      AS approved_spend,
    COALESCE((SELECT SUM(amount) FROM spend s
              WHERE s.department = d.department AND s.outcome = 'pending'), 0)::float8
      AS pending_spend
  FROM departments d`;

const FINANCIAL_YEARS_SQL = `
  SELECT DISTINCT financial_year FROM casual_department_budgets
  UNION SELECT $1::text`;

const budgetUsed = ({ budget, spent }: { budget: number; spent: number }) =>
  budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;

export async function loadCasualBudget(
  financialYear: string,
  department: string,
): Promise<CasualBudget> {
  const params = [financialYear, department];

  const [monthly, byDepartment, years] = await Promise.all([
    query<{
      month: string;
      budget: number;
      approved_spend: number;
      pending_spend: number;
    }>(BUDGET_MONTHLY_SQL, params),
    query<{
      department: string;
      budget: number;
      baseline: number;
      approved_spend: number;
      pending_spend: number;
    }>(BUDGET_BY_DEPARTMENT_SQL, params),
    query<{ financial_year: string }>(FINANCIAL_YEARS_SQL, [financialYear]),
  ]);

  const sum = (rows: { [key: string]: number | string }[], key: string) =>
    rows.reduce((total, row) => total + Number(row[key]), 0);

  return {
    financialYear,
    financialYears: years
      .map((row) => row.financial_year)
      .sort()
      .reverse(),
    totals: {
      budget: sum(byDepartment, "budget"),
      baseline: sum(byDepartment, "baseline"),
      approvedSpend: sum(byDepartment, "approved_spend"),
      pendingSpend: sum(byDepartment, "pending_spend"),
    },
    monthly: monthly.map((row) => ({
      month: row.month,
      budget: row.budget,
      approvedSpend: row.approved_spend,
      pendingSpend: row.pending_spend,
    })),
    // Most of their budget used first; spend with no budget counts as over
    byDepartment: byDepartment
      .map((row) => ({
        department: row.department,
        budget: row.budget,
        spent: row.approved_spend + row.baseline,
        pendingSpend: row.pending_spend,
      }))
      .sort(
        (a, b) =>
          budgetUsed(b) - budgetUsed(a) ||
          a.department.localeCompare(b.department),
      ),
  };
}
