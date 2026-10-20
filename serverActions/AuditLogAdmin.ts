"use server";
import { query } from "@/lib/db";
import {
  emptyPaginatedResult,
  type PaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { getConfigAdminSession } from "@/lib/configAdminAccess";

// The Settings page's Audit log tab: read-only views of config_changes
// (every change made on Settings and in the salary advance staff
// directory, migration 026) and report_downloads (every report download,
// migration 022).

export interface ConfigChangeEntry {
  id: string;
  tableName: string;
  action: "create" | "update" | "delete";
  summary: string;
  beforeData: unknown;
  afterData: unknown;
  changedByName: string;
  changedByEmail: string;
  changedAt: string;
}

export interface ReportDownloadEntry {
  id: number;
  reportType: string;
  fromDate: string;
  toDate: string;
  statusFilter: string;
  rowCount: number;
  downloadedByName: string;
  downloadedByEmail: string;
  downloadedAt: string;
}

const DATE_FORMAT = `'DD Mon YYYY, HH24:MI'`;

export async function getConfigChangeLog({
  page = 1,
  pageSize = 20,
  searchTerm,
  tableName,
}: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  tableName?: string;
}): Promise<PaginatedResult<ConfigChangeEntry>> {
  if (!(await getConfigAdminSession()))
    return emptyPaginatedResult(page, pageSize);

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const term = searchTerm?.trim() ? `%${searchTerm.trim()}%` : null;

  const rows = await query<ConfigChangeEntry & { total_count: string }>(
    `SELECT id::text, table_name AS "tableName", action, summary,
     before_data AS "beforeData", after_data AS "afterData",
     changed_by_name AS "changedByName", changed_by_email AS "changedByEmail",
     TO_CHAR(changed_at AT TIME ZONE 'Africa/Nairobi', ${DATE_FORMAT}) AS "changedAt",
     COUNT(*) OVER() AS total_count
     FROM config_changes
     WHERE ($1::text IS NULL OR summary ILIKE $1 OR changed_by_name ILIKE $1
       OR changed_by_email ILIKE $1)
     AND ($2::text IS NULL OR table_name = $2)
     ORDER BY changed_at DESC, id DESC
     LIMIT $3 OFFSET $4`,
    [term, tableName || null, limit, offset],
  );
  return toPaginatedResult(rows, page, pageSize);
}

// The tables config_changes has rows for, for the filter
export async function getConfigChangeTables(): Promise<string[]> {
  if (!(await getConfigAdminSession())) return [];
  const rows = await query<{ name: string }>(
    `SELECT DISTINCT table_name AS name FROM config_changes ORDER BY 1`,
  );
  return rows.map((row) => row.name);
}

export async function getReportDownloadLog({
  page = 1,
  pageSize = 20,
  searchTerm,
}: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}): Promise<PaginatedResult<ReportDownloadEntry>> {
  if (!(await getConfigAdminSession()))
    return emptyPaginatedResult(page, pageSize);

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const term = searchTerm?.trim() ? `%${searchTerm.trim()}%` : null;

  const rows = await query<ReportDownloadEntry & { total_count: string }>(
    `SELECT id, report_type AS "reportType",
     TO_CHAR(from_date, 'YYYY-MM-DD') AS "fromDate",
     TO_CHAR(to_date, 'YYYY-MM-DD') AS "toDate",
     status_filter AS "statusFilter", row_count AS "rowCount",
     downloaded_by_name AS "downloadedByName",
     downloaded_by_email AS "downloadedByEmail",
     TO_CHAR(downloaded_at AT TIME ZONE 'Africa/Nairobi', ${DATE_FORMAT}) AS "downloadedAt",
     COUNT(*) OVER() AS total_count
     FROM report_downloads
     WHERE $1::text IS NULL OR report_type ILIKE $1
       OR downloaded_by_name ILIKE $1 OR downloaded_by_email ILIKE $1
     ORDER BY downloaded_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [term, limit, offset],
  );
  return toPaginatedResult(rows, page, pageSize);
}
