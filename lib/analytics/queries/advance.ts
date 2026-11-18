import "server-only";
import { query } from "@/lib/db";
import { createdInRange } from "@/lib/reports/sql";
import { MONTHS, daysBetween, nairobiMonth } from "@/lib/analytics/sql";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { AdvanceAnalytics } from "@/lib/analytics/types";

// Salary advance analytics. Every query takes $1 from, $2 to (inclusive
// Nairobi submission dates) and $3 department ('' = all).
//
// Departments are the staff_department copied onto each request from
// company_staff_data (the HR import), not base_departments, so the filter
// offers the names stored on requests (loadAdvanceDepartmentNames).
// request_amount is BIGINT, so sums are cast to float8 to arrive as numbers.

const REQUESTS = `
  req AS (
    SELECT sa.*
    FROM salary_advances sa
    WHERE ${createdInRange("sa.request_created_at")}
      AND ($3 = '' OR sa.staff_department = $3)
  )`;

const WITH = `WITH ${REQUESTS}`;
const APPROVED = `approval_status = 'approved'`;
const PENDING = `approval_status = 'pending'`;
const DECLINED = `approval_status = 'declined'`;
const ONEOFF = `request_type = 'oneoff'`;
const CONTINUOUS = `request_type = 'continuous'`;
const sumAmount = (where: string) =>
  `COALESCE(SUM(request_amount) FILTER (WHERE ${where}), 0)::float8`;

const TOTALS_SQL = `${WITH}
  SELECT
    COUNT(*)::int AS requests,
    COUNT(DISTINCT staff_number)::int AS staff,
    (SELECT COUNT(*) FROM (
       SELECT staff_number FROM req GROUP BY staff_number HAVING COUNT(*) > 1
     ) r)::int AS repeat_staff,
    COUNT(*) FILTER (WHERE ${ONEOFF})::int AS oneoff_requests,
    ${sumAmount(ONEOFF)} AS oneoff_amount,
    COUNT(*) FILTER (WHERE ${CONTINUOUS})::int AS continuous_requests,
    ${sumAmount(CONTINUOUS)} AS continuous_amount,
    COUNT(*) FILTER (WHERE ${APPROVED})::int AS approved_requests,
    ${sumAmount(`${APPROVED} AND ${ONEOFF}`)} AS approved_oneoff_amount,
    COUNT(*) FILTER (WHERE ${APPROVED} AND ${CONTINUOUS})::int
      AS approved_continuous_requests,
    ${sumAmount(`${APPROVED} AND ${CONTINUOUS}`)} AS approved_continuous_amount,
    COUNT(*) FILTER (WHERE ${PENDING})::int AS pending_requests,
    ${sumAmount(`${PENDING} AND ${ONEOFF}`)} AS pending_oneoff_amount,
    COUNT(*) FILTER (WHERE ${DECLINED})::int AS declined_requests,
    (AVG(request_amount) FILTER (WHERE ${APPROVED} AND ${ONEOFF}))::float8
      AS avg_approved_oneoff,
    (AVG(${daysBetween("request_created_at", "hr_reviewed_at")})
       FILTER (WHERE NOT ${PENDING} AND hr_reviewed_at IS NOT NULL))::float8
      AS avg_days_to_review
  FROM req`;

const MONTHLY_SQL = `${WITH}, ${MONTHS}
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COUNT(q.request_id)::int AS requested,
    COUNT(q.request_id) FILTER (WHERE q.${APPROVED})::int AS approved
  FROM months m
  LEFT JOIN req q ON ${nairobiMonth("q.request_created_at")} = m.month
  GROUP BY m.month
  ORDER BY m.month`;

// Every month from the first repayment start to the last, so gaps show
const BY_REPAYMENT_MONTH_SQL = `${WITH},
  oneoff AS (
    SELECT DATE_TRUNC('month', repayment_start_date)::date AS month,
           request_amount, approval_status
    FROM req
    WHERE ${ONEOFF} AND NOT ${DECLINED}
  ),
  repayment_months AS (
    SELECT generate_series(MIN(month), MAX(month), INTERVAL '1 month')::date AS month
    FROM oneoff
  )
  SELECT
    TO_CHAR(m.month, 'YYYY-MM') AS month,
    COALESCE(SUM(o.request_amount) FILTER (WHERE o.${APPROVED}), 0)::float8
      AS approved_amount,
    COALESCE(SUM(o.request_amount) FILTER (WHERE o.${PENDING}), 0)::float8
      AS pending_amount
  FROM repayment_months m
  LEFT JOIN oneoff o ON o.month = m.month
  GROUP BY m.month
  ORDER BY m.month`;

const BY_DEPARTMENT_SQL = `${WITH}
  SELECT
    staff_department AS department,
    COUNT(*) FILTER (WHERE ${APPROVED})::int AS approved,
    COUNT(*) FILTER (WHERE ${PENDING})::int AS pending
  FROM req
  GROUP BY staff_department
  HAVING COUNT(*) FILTER (WHERE ${APPROVED} OR ${PENDING}) > 0
  ORDER BY approved DESC, pending DESC, department`;

const BY_LOCATION_SQL = `${WITH}
  SELECT staff_location AS location, COUNT(*)::int AS requests
  FROM req
  WHERE ${APPROVED} OR ${PENDING}
  GROUP BY staff_location
  ORDER BY requests DESC, location`;

const BY_INSTALLMENTS_SQL = `${WITH}
  SELECT no_of_installments AS installments, COUNT(*)::int AS requests
  FROM req
  WHERE ${APPROVED} AND ${ONEOFF}
  GROUP BY no_of_installments
  ORDER BY no_of_installments`;

// Bands are [lower, upper) in KES; the label is shown as is
const AMOUNT_BANDS: { label: string; upper: number | null }[] = [
  { label: "Under KES 10K", upper: 10_000 },
  { label: "KES 10K – 25K", upper: 25_000 },
  { label: "KES 25K – 50K", upper: 50_000 },
  { label: "KES 50K – 100K", upper: 100_000 },
  { label: "KES 100K and over", upper: null },
];

const BAND_INDEX = `CASE
  ${AMOUNT_BANDS.filter((band) => band.upper !== null)
    .map((band, index) => `WHEN request_amount < ${band.upper} THEN ${index}`)
    .join("\n  ")}
  ELSE ${AMOUNT_BANDS.length - 1}
END`;

const BY_AMOUNT_BAND_SQL = `${WITH}
  SELECT ${BAND_INDEX} AS band_index,
         COUNT(*)::int AS requests,
         SUM(request_amount)::float8 AS amount
  FROM req
  WHERE ${APPROVED} AND ${ONEOFF}
  GROUP BY band_index
  ORDER BY band_index`;

const ALTERATIONS_SQL = `${WITH}
  SELECT a.alteration_type AS kind, COUNT(DISTINCT a.request_id)::int AS requests
  FROM salary_advance_alterations a
  JOIN req ON req.request_id = a.request_id
  WHERE a.alteration_type IN ('switch_to_oneoff', 'reduce_installments')
  GROUP BY a.alteration_type
  ORDER BY a.alteration_type DESC`;

// The departments stored on salary advance requests, for the filter
export async function loadAdvanceDepartmentNames(): Promise<string[]> {
  const rows = await query<{ department: string }>(
    `SELECT DISTINCT staff_department AS department
     FROM salary_advances
     ORDER BY staff_department`,
  );
  return rows.map((row) => row.department);
}

export async function loadAdvanceAnalytics({
  from,
  to,
  department,
}: AnalyticsFilters): Promise<AdvanceAnalytics> {
  const params = [from, to, department];

  const [
    totalsRows,
    monthly,
    byRepaymentMonth,
    byDepartment,
    byLocation,
    byInstallments,
    byAmountBand,
    alterations,
  ] = await Promise.all([
    query<{
      requests: number;
      staff: number;
      repeat_staff: number;
      oneoff_requests: number;
      oneoff_amount: number;
      continuous_requests: number;
      continuous_amount: number;
      approved_requests: number;
      approved_oneoff_amount: number;
      approved_continuous_requests: number;
      approved_continuous_amount: number;
      pending_requests: number;
      pending_oneoff_amount: number;
      declined_requests: number;
      avg_approved_oneoff: number | null;
      avg_days_to_review: number | null;
    }>(TOTALS_SQL, params),
    query<{ month: string; requested: number; approved: number }>(
      MONTHLY_SQL,
      params,
    ),
    query<{ month: string; approved_amount: number; pending_amount: number }>(
      BY_REPAYMENT_MONTH_SQL,
      params,
    ),
    query<{ department: string; approved: number; pending: number }>(
      BY_DEPARTMENT_SQL,
      params,
    ),
    query<{ location: string; requests: number }>(BY_LOCATION_SQL, params),
    query<{ installments: number; requests: number }>(
      BY_INSTALLMENTS_SQL,
      params,
    ),
    query<{ band_index: number; requests: number; amount: number }>(
      BY_AMOUNT_BAND_SQL,
      params,
    ),
    query<{
      kind: AdvanceAnalytics["alterations"][number]["kind"];
      requests: number;
    }>(ALTERATIONS_SQL, params),
  ]);

  const totals = totalsRows[0];

  return {
    totals: {
      requests: totals.requests,
      staff: totals.staff,
      repeatStaff: totals.repeat_staff,
      oneoffRequests: totals.oneoff_requests,
      oneoffAmount: totals.oneoff_amount,
      continuousRequests: totals.continuous_requests,
      continuousAmount: totals.continuous_amount,
      approvedRequests: totals.approved_requests,
      approvedOneoffAmount: totals.approved_oneoff_amount,
      approvedContinuousRequests: totals.approved_continuous_requests,
      approvedContinuousAmount: totals.approved_continuous_amount,
      pendingRequests: totals.pending_requests,
      pendingOneoffAmount: totals.pending_oneoff_amount,
      declinedRequests: totals.declined_requests,
      avgApprovedOneoff: totals.avg_approved_oneoff,
      avgDaysToReview: totals.avg_days_to_review,
    },
    monthly,
    byRepaymentMonth: byRepaymentMonth.map((row) => ({
      month: row.month,
      approvedAmount: row.approved_amount,
      pendingAmount: row.pending_amount,
    })),
    byDepartment,
    byLocation,
    byInstallments,
    byAmountBand: byAmountBand.map((row) => ({
      band: AMOUNT_BANDS[row.band_index].label,
      requests: row.requests,
      amount: row.amount,
    })),
    alterations,
  };
}
