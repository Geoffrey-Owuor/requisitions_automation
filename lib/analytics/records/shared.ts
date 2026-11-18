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

export async function loadRecords({
  table,
  columns,
  departmentColumn,
  searchable,
  filterSql,
  args: { filters, recordFilters, page, pageSize, searchTerm },
}: {
  table: string;
  columns: string;
  departmentColumn: string;
  searchable: readonly string[];
  filterSql: RecordFilterSql;
  args: RecordsArgs;
}): Promise<PaginatedResult<QueryResultRow>> {
  const conditions = [
    createdInRange("request_created_at"),
    `($3 = '' OR ${departmentColumn} = $3)`,
    `($4 = '' OR ${searchable.map((column) => `${column}::text ILIKE $4`).join(" OR ")})`,
  ];
  for (const [key, value] of Object.entries(recordFilters)) {
    const condition = filterSql[key]?.[value];
    if (condition) conditions.push(`(${condition})`);
  }

  const term = searchTerm.trim();
  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const rows = await query(
    `SELECT ${columns}, COUNT(*) OVER() AS total_count
     FROM ${table}
     WHERE ${conditions.join("\n       AND ")}
     ORDER BY request_created_at DESC, request_id
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
