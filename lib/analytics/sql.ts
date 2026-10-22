import "server-only";
import { nairobi } from "@/lib/reports/sql";

// SQL fragments shared by the analytics queries in lib/analytics/queries/,
// which all take $1 from and $2 to (inclusive Nairobi submission dates).

/** CTE `months(month)`: every calendar month the date range touches. */
export const MONTHS = `
  months AS (
    SELECT generate_series(DATE_TRUNC('month', $1::date),
                           DATE_TRUNC('month', $2::date),
                           INTERVAL '1 month')::date AS month
  )`;

/** The Nairobi calendar month a stored timestamp falls in, as a date. */
export const nairobiMonth = (column: string) =>
  `DATE_TRUNC('month', ${nairobi(column)})::date`;

/** Calendar days between two stored timestamps, as a fraction. */
export const daysBetween = (from: string, to: string) =>
  `(EXTRACT(EPOCH FROM ${to} - ${from}) / 86400)`;
