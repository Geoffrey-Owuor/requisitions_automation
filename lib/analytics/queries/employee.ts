import "server-only";
import { query } from "@/lib/db";
import { createdInRange, nairobi } from "@/lib/reports/sql";
import { MONTHS, daysBetween, nairobiMonth } from "@/lib/analytics/sql";
import {
  defaultAnalyticsRange,
  type AnalyticsFilters,
} from "@/lib/analytics/definitions";
import type {
  EmployeeAnalytics,
  EmployeeDepartmentOverview,
} from "@/lib/analytics/types";
import type { EmployeeStage } from "@/public/assets";

// Employee Requisition analytics. Every query takes $1 from, $2 to
// (inclusive Nairobi submission dates), $3 department ('' = all) and $4 a
// requisition to leave out (NULL = none) — the one an approver is reviewing.

// One row per requisition in range, with its outcome, the stage it waits on
// (pending) or was declined at (declined) — the first stage in its own
// approval order (lib/employeeApprovalOrder.ts) that isn't approved — and
// its latest decision, which for a decided requisition is the final one
// (an amendment resets every stage's date). Requisitions imported from
// before the app (migration 036) count everywhere except the average days
// to a decision, since their dates were entered by hand.
const REQUISITIONS = `
  req AS (
    SELECT
      e.request_id,
      e.request_created_at,
      e.employee_department,
      CASE
        WHEN 'declined' IN (e.employee_hod_approval_status,
                            e.employee_retail_director_approval_status,
                            e.employee_director_approval_status,
                            e.employee_hr_approval_status) THEN 'declined'
        WHEN (CASE WHEN e.hr_before_director
                   THEN e.employee_director_approval_status
                   ELSE e.employee_hr_approval_status END) = 'approved' THEN 'approved'
        ELSE 'pending'
      END AS outcome,
      CASE
        WHEN e.employee_hod_approval_status <> 'approved' THEN 'hod'
        WHEN e.employee_retail_director_approval_status NOT IN ('approved', 'N/A')
          THEN 'retail_director'
        WHEN e.hr_before_director AND e.employee_hr_approval_status <> 'approved' THEN 'hr'
        WHEN e.employee_director_approval_status <> 'approved' THEN 'director'
        WHEN e.employee_hr_approval_status <> 'approved' THEN 'hr'
      END AS open_stage,
      GREATEST(e.employee_hod_approval_date,
               e.employee_retail_director_approval_date,
               e.employee_director_approval_date,
               e.employee_hr_approval_date) AS decided_at,
      e.imported_at IS NOT NULL AS imported
    FROM employee_requisitions e
    WHERE ${createdInRange("e.request_created_at")}
      AND ($3 = '' OR e.employee_department = $3)
      AND ($4::uuid IS NULL OR e.request_id <> $4::uuid)
  )`;

// Salary ranges are stored as text, "<min> - <max>" (or "<min> to <max>"
// on some early rows) — the SQL twin of parseSalaryRange in public/assets.ts
const SALARY_PATTERN = `'^\\s*\\d+(\\.\\d+)?\\s*(-|to)\\s*\\d+(\\.\\d+)?\\s*$'`;

const POSITIONS = `
  pos AS (
    SELECT
      p.*,
      req.outcome,
      req.employee_department,
      req.decided_at,
      CASE WHEN p.position_salary_range ~ ${SALARY_PATTERN}
           THEN SUBSTRING(p.position_salary_range FROM '^\\s*(\\d+(?:\\.\\d+)?)')::numeric
      END AS salary_min,
      CASE WHEN p.position_salary_range ~ ${SALARY_PATTERN}
           THEN SUBSTRING(p.position_salary_range FROM '(\\d+(?:\\.\\d+)?)\\s*$')::numeric
      END AS salary_max
    FROM employee_requisition_positions p
    JOIN req ON req.request_id = p.request_id
  )`;

const WITH = `WITH ${REQUISITIONS}, ${POSITIONS}`;

const TOTALS_SQL = `${WITH}
  SELECT
    (SELECT COUNT(*) FROM req)::int AS requisitions,
    (SELECT COUNT(*) FROM req WHERE outcome = 'approved')::int AS approved_requisitions,
    (SELECT COUNT(*) FROM req WHERE outcome = 'pending')::int AS pending_requisitions,
    (SELECT COUNT(*) FROM req WHERE outcome = 'declined')::int AS declined_requisitions,
    (SELECT AVG(${daysBetween("request_created_at", "decided_at")})
       FROM req WHERE outcome <> 'pending' AND decided_at IS NOT NULL
         AND NOT imported)::float8
      AS avg_days_to_decision,
    COALESCE(SUM(number_required), 0)::int AS headcount_requested,
    COALESCE(SUM(number_required) FILTER (WHERE outcome = 'approved'), 0)::int
      AS approved_headcount,
    COALESCE(SUM(number_required) FILTER (WHERE outcome = 'pending'), 0)::int
      AS pending_headcount,
    COALESCE(SUM(number_required * salary_min) FILTER (WHERE outcome = 'approved'), 0)::float8
      AS approved_salary_min,
    COALESCE(SUM(number_required * salary_max) FILTER (WHERE outcome = 'approved'), 0)::float8
      AS approved_salary_max,
    COUNT(*) FILTER (WHERE outcome = 'approved' AND salary_min IS NULL)::int
      AS unpriced_approved_positions
  FROM pos`;

const MONTHLY_SQL = `${WITH}, ${MONTHS},
  pos_month AS (
    SELECT ${nairobiMonth("req.request_created_at")} AS month,
           pos.number_required, pos.outcome
    FROM pos JOIN req ON req.request_id = pos.request_id
  )
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COALESCE(SUM(pm.number_required), 0)::int AS requested_headcount,
    COALESCE(SUM(pm.number_required) FILTER (WHERE pm.outcome = 'approved'), 0)::int
      AS approved_headcount
  FROM months m
  LEFT JOIN pos_month pm ON pm.month = m.month
  GROUP BY m.month
  ORDER BY m.month`;

const BY_DEPARTMENT_SQL = `${WITH}
  SELECT
    employee_department AS department,
    COALESCE(SUM(number_required) FILTER (WHERE outcome = 'approved'), 0)::int
      AS approved_headcount,
    COALESCE(SUM(number_required) FILTER (WHERE outcome = 'pending'), 0)::int
      AS pending_headcount
  FROM pos
  GROUP BY employee_department
  HAVING SUM(number_required) FILTER (WHERE outcome IN ('approved', 'pending')) > 0
  ORDER BY approved_headcount DESC, pending_headcount DESC, department`;

const REPLACEMENT_OR_NEW_SQL = `${WITH}
  SELECT position_replacement_or_new AS kind, SUM(number_required)::int AS headcount
  FROM pos WHERE outcome = 'approved'
  GROUP BY position_replacement_or_new
  ORDER BY position_replacement_or_new`;

const BY_GRADE_SQL = `${WITH}
  SELECT position_job_grade AS grade,
         MIN(position_job_grade_rank)::int AS rank,
         SUM(number_required)::int AS headcount
  FROM pos WHERE outcome = 'approved'
  GROUP BY position_job_grade
  ORDER BY MIN(position_job_grade_rank) NULLS LAST, position_job_grade`;

const BY_STAGE_SQL = `${WITH},
  req_headcount AS (
    SELECT request_id, SUM(number_required) AS headcount FROM pos GROUP BY request_id
  )
  SELECT req.outcome, req.open_stage AS stage,
         COUNT(*)::int AS requisitions,
         COALESCE(SUM(rh.headcount), 0)::int AS headcount
  FROM req LEFT JOIN req_headcount rh ON rh.request_id = req.request_id
  WHERE req.outcome IN ('pending', 'declined')
  GROUP BY req.outcome, req.open_stage`;

const RECENT_APPROVED_SQL = `${WITH}
  SELECT
    position_id,
    position_title,
    employee_department AS department,
    position_job_grade AS grade,
    position_job_grade_rank AS rank,
    number_required AS headcount,
    position_replacement_or_new,
    position_salary_range,
    TO_CHAR(${nairobi("decided_at")}, 'YYYY-MM-DD') AS approved_on
  FROM pos
  WHERE outcome = 'approved'
  ORDER BY decided_at DESC NULLS LAST, position_title
  LIMIT 8`;

// The order pipeline and decline stages are listed in. The HR/CEO order
// differs between requisitions, so this is the current order's.
const STAGE_ORDER: EmployeeStage[] = [
  "hod",
  "retail_director",
  "hr",
  "director",
];

export async function loadEmployeeAnalytics(
  { from, to, department }: AnalyticsFilters,
  { excludeRequestId = null }: { excludeRequestId?: string | null } = {},
): Promise<EmployeeAnalytics> {
  const params = [from, to, department, excludeRequestId];

  const [
    totalsRows,
    monthly,
    byDepartment,
    replacementOrNew,
    byGrade,
    byStage,
    recent,
  ] = await Promise.all([
    query<{
      requisitions: number;
      approved_requisitions: number;
      pending_requisitions: number;
      declined_requisitions: number;
      avg_days_to_decision: number | null;
      headcount_requested: number;
      approved_headcount: number;
      pending_headcount: number;
      approved_salary_min: number;
      approved_salary_max: number;
      unpriced_approved_positions: number;
    }>(TOTALS_SQL, params),
    query<{
      month: string;
      requested_headcount: number;
      approved_headcount: number;
    }>(MONTHLY_SQL, params),
    query<{
      department: string;
      approved_headcount: number;
      pending_headcount: number;
    }>(BY_DEPARTMENT_SQL, params),
    query<{ kind: string; headcount: number }>(REPLACEMENT_OR_NEW_SQL, params),
    query<{ grade: string; rank: number | null; headcount: number }>(
      BY_GRADE_SQL,
      params,
    ),
    query<{
      outcome: "pending" | "declined";
      stage: EmployeeStage;
      requisitions: number;
      headcount: number;
    }>(BY_STAGE_SQL, params),
    query<{
      position_id: string;
      position_title: string;
      department: string;
      grade: string;
      rank: number | null;
      headcount: number;
      position_replacement_or_new: string;
      position_salary_range: string;
      approved_on: string;
    }>(RECENT_APPROVED_SQL, params),
  ]);

  const totals = totalsRows[0];
  const stageRows = (outcome: "pending" | "declined") =>
    STAGE_ORDER.flatMap((stage) =>
      byStage.filter((row) => row.outcome === outcome && row.stage === stage),
    );

  return {
    totals: {
      requisitions: totals.requisitions,
      headcountRequested: totals.headcount_requested,
      approvedRequisitions: totals.approved_requisitions,
      approvedHeadcount: totals.approved_headcount,
      pendingRequisitions: totals.pending_requisitions,
      pendingHeadcount: totals.pending_headcount,
      declinedRequisitions: totals.declined_requisitions,
      avgDaysToDecision: totals.avg_days_to_decision,
      approvedSalaryMin: totals.approved_salary_min,
      approvedSalaryMax: totals.approved_salary_max,
      unpricedApprovedPositions: totals.unpriced_approved_positions,
    },
    monthly: monthly.map((row) => ({
      month: row.month,
      requestedHeadcount: row.requested_headcount,
      approvedHeadcount: row.approved_headcount,
    })),
    byDepartment: byDepartment.map((row) => ({
      department: row.department,
      approvedHeadcount: row.approved_headcount,
      pendingHeadcount: row.pending_headcount,
    })),
    replacementOrNew,
    byGrade,
    pipeline: stageRows("pending").map(
      ({ stage, requisitions, headcount }) => ({
        stage,
        requisitions,
        headcount,
      }),
    ),
    declines: stageRows("declined").map(({ stage, requisitions }) => ({
      stage,
      requisitions,
    })),
    recentApproved: recent.map((row) => ({
      positionId: row.position_id,
      positionTitle: row.position_title,
      department: row.department,
      grade: row.grade,
      rank: row.rank,
      headcount: row.headcount,
      replacementOrNew: row.position_replacement_or_new,
      salaryRange: row.position_salary_range,
      approvedOn: row.approved_on,
    })),
  };
}

export async function loadEmployeeDepartmentOverview(
  department: string,
  excludeRequestId: string,
): Promise<EmployeeDepartmentOverview> {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());
  const range = defaultAnalyticsRange(today);

  const { totals, byGrade, replacementOrNew, recentApproved } =
    await loadEmployeeAnalytics({ ...range, department }, { excludeRequestId });

  return {
    from: range.from,
    totals,
    byGrade,
    replacementOrNew,
    recentApproved: recentApproved.slice(0, 5),
  };
}
