import "server-only";

// SQL fragments shared by the report queries in lib/reports/queries/.
//
// Every report query takes the same three parameters:
//   $1 from date (YYYY-MM-DD, inclusive), $2 to date (inclusive),
//   $3 status bucket ('all' | 'approved' | 'declined' | 'pending').
//
// Timestamps are stored as TIMESTAMP (no time zone) in the database
// session's time zone (they're all written with CURRENT_TIMESTAMP/NOW()),
// so casting to timestamptz recovers the instant and AT TIME ZONE turns it
// into Africa/Nairobi wall-clock time — whatever time zone the server runs in.

export const NAIROBI = "'Africa/Nairobi'";

/** A stored timestamp as Africa/Nairobi wall-clock time. */
export const nairobi = (column: string) =>
  `(${column}::timestamptz AT TIME ZONE ${NAIROBI})`;

/** A timestamp as an Excel date-time serial in Nairobi time (NULL stays NULL). */
export const excelDateTime = (column: string) =>
  `(EXTRACT(EPOCH FROM ${nairobi(column)}) / 86400.0 + 25569)::float8`;

/** A DATE column as an Excel date serial. */
export const excelDate = (column: string) =>
  `(${column} - DATE '1899-12-30')`;

/** A timestamp as text in Nairobi time, for use inside history strings. */
export const nairobiText = (column: string, format = "DD Mon YYYY HH24:MI") =>
  `TO_CHAR(${nairobi(column)}, '${format}')`;

/**
 * `column` falls on a Nairobi calendar day from $1 to $2 inclusive. The
 * bounds are converted back to stored (session time zone) timestamps rather
 * than converting the column, so an index on it still applies.
 */
export const createdInRange = (column: string) => `(
  ${column} >= (($1::date)::timestamp AT TIME ZONE ${NAIROBI})::timestamp
  AND ${column} < (($2::date + 1)::timestamp AT TIME ZONE ${NAIROBI})::timestamp
)`;

/** Matches the $3 status filter against a report's status bucket expression. */
export const statusMatches = (bucket: string) =>
  `($3 = 'all' OR (${bucket}) = $3)`;

/** Amounts with thousands separators, inside history strings. */
export const moneyText = (column: string) =>
  `TO_CHAR(${column}, 'FM999,999,999')`;

/** Shared "Reference" column: the first 8 characters of the request UUID. */
export const reference = (column: string) =>
  `UPPER(LEFT(${column}::text, 8))`;
