import "server-only";
import { query } from "@/lib/db";

// New salary advance requests may be submitted from the 1st to the 10th of
// each month, inclusive, in Africa/Nairobi time — or later while a manual
// extension is active (salary_advance_settings.extended_until, migration
// 023). The extension is deliberately invisible to staff: nothing returned
// here says whether the window is open because of it.
export const SUBMISSION_DEADLINE_DAY = 10;

// Repayment can't start before the 15th (the monthly processing date) or
// before today, and no later than the last day of next month.
const REPAYMENT_START_DAY = 15;

export interface AdvanceSubmissionWindow {
  isOpen: boolean;
  // YYYY-MM-DD bounds for the repayment start date
  repaymentMinDate: string;
  repaymentMaxDate: string;
  // The 1st of next month, e.g. "1 November 2026" — shown when closed
  reopensOn: string;
}

// All date math in SQL, so neither the server's nor the browser's timezone
// matters (same approach as PUSHBACK_WINDOW_SQL in lib/travelPushback.ts).
const SUBMISSION_WINDOW_QUERY = `
  WITH t AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date AS today
  )
  SELECT
    (EXTRACT(DAY FROM t.today) <= $1::int
      OR COALESCE(s.extended_until >= t.today, FALSE)) AS is_open,
    TO_CHAR(GREATEST(t.today, DATE_TRUNC('month', t.today)::date + ($2::int - 1)), 'YYYY-MM-DD') AS repayment_min_date,
    TO_CHAR((DATE_TRUNC('month', t.today) + INTERVAL '2 months - 1 day')::date, 'YYYY-MM-DD') AS repayment_max_date,
    TO_CHAR((DATE_TRUNC('month', t.today) + INTERVAL '1 month')::date, 'YYYY-MM-DD') AS reopens_on
  FROM t
  LEFT JOIN salary_advance_settings s ON s.id = 1
`;

export async function getAdvanceSubmissionWindow(): Promise<AdvanceSubmissionWindow> {
  const [row] = await query<{
    is_open: boolean;
    repayment_min_date: string;
    repayment_max_date: string;
    reopens_on: string;
  }>(SUBMISSION_WINDOW_QUERY, [SUBMISSION_DEADLINE_DAY, REPAYMENT_START_DAY]);

  return {
    isOpen: row.is_open,
    repaymentMinDate: row.repayment_min_date,
    repaymentMaxDate: row.repayment_max_date,
    reopensOn: formatWindowDate(row.reopens_on),
  };
}

// YYYY-MM-DD strings compare correctly as text
export function isRepaymentStartDateAllowed(
  date: string,
  window: AdvanceSubmissionWindow,
): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= window.repaymentMinDate &&
    date <= window.repaymentMaxDate
  );
}

function formatWindowDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
