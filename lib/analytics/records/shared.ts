import "server-only";
import { query } from "@/lib/db";
import { createdInRange } from "@/lib/reports/sql";
import {
  type PaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { RecordFilters } from "@/lib/analytics/records";
import type { QueryResultRow } from "pg";

// The paged query behind every dashboard's Records view. Parameters:
// $1 from, $2 to (inclusive Nairobi submission dates), $3 department
// ('' = all), $4 search pattern ('' = none), $5 limit, $6 offset.

export type RecordsArgs = {
  filters: AnalyticsFilters;
  // Already checked against the dashboard's filter specs
  recordFilters: RecordFilters;
  page: number;
  pageSize: number;
  searchTerm: string;
};

// Filter key -> option value -> a SQL condition on the table's columns.
// Conditions are fixed text, never built from the request.
export type RecordFilterSql = Record<string, Record<string, string>>;

// The Status filter's SQL from a type's outcome and open-stage expressions
// (bucketed as its analytics queries bucket them): "approved", and
// "awaiting-{stage}" / "declined-{stage}" for each stage. Keep in step with
// recordStatusFilter in lib/analytics/records.ts.
export function statusFilterSql(
  outcome: string,
  openStage: string,
  stages: readonly string[],
): Record<string, string> {
  const sql: Record<string, string> = {
    approved: `(${outcome}) = 'approved'`,
  };
  for (const stage of stages) {
    sql[`awaiting-${stage}`] =
      `(${outcome}) = 'pending' AND (${openStage}) = '${stage}'`;
    sql[`declined-${stage}`] =
      `(${outcome}) = 'declined' AND (${openStage}) = '${stage}'`;
  }
  return sql;
}

export async function loadRecords({
  from,
  alias,
  columns,
  departmentColumn,
  searchable,
  extraSearch,
  filterSql,
  args: { filters, recordFilters, page, pageSize, searchTerm },
}: {
  // The FROM clause, naming the requisitions table `alias`
  from: string;
  alias: string;
  columns: string;
  departmentColumn: string;
  searchable: readonly string[];
  // Another search match, given the pattern parameter (e.g. on child rows)
  extraSearch?: (param: string) => string;
  filterSql: RecordFilterSql;
  args: RecordsArgs;
}): Promise<PaginatedResult<QueryResultRow>> {
  const searchMatches = searchable.map((column) => `${column}::text ILIKE $4`);
  if (extraSearch) searchMatches.push(extraSearch("$4"));
  const conditions = [
    createdInRange(`${alias}.request_created_at`),
    `($3 = '' OR ${departmentColumn} = $3)`,
    `($4 = '' OR ${searchMatches.join(" OR ")})`,
  ];
  for (const [key, value] of Object.entries(recordFilters)) {
    const condition = filterSql[key]?.[value];
    if (condition) conditions.push(`(${condition})`);
  }

  const term = searchTerm.trim();
  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const rows = await query(
    `SELECT ${columns}, COUNT(*) OVER() AS total_count
     FROM ${from}
     WHERE ${conditions.join("\n       AND ")}
     ORDER BY ${alias}.request_created_at DESC, ${alias}.request_id
     LIMIT $5 OFFSET $6`,
    [
      filters.from,
      filters.to,
      filters.department,
      term ? `%${term}%` : "",
      limit,
      offset,
    ],
  );
  return toPaginatedResult(rows, page, pageSize);
}
