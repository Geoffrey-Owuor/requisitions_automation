"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { alterationsJsonLateral } from "@/lib/salaryAdvanceRules";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";

export interface SalaryAdvanceAlteration {
  alterationType: string;
  previousRequestType: string | null;
  newRequestType: string | null;
  previousInstallments: number | null;
  newInstallments: number | null;
  exported: boolean;
  createdAt: string;
}

export interface SalaryAdvanceData {
  request_id: string;
  request_created_at: string;
  staff_number: string;
  staff_name: string;
  staff_email: string;
  staff_department: string;
  staff_location: string;
  request_amount: number;
  no_of_installments: string;
  repayment_start_date: string;
  request_type: string;
  approval_status: string;
  approver_comments: string;
  exported: boolean;
  // Whether this request has an audit row in salary_advance_alterations —
  // which, since that table is only ever written once a request is
  // exported (see SubmitAlterationRequest.ts), reads as "altered since
  // export" rather than "ever altered".
  altered: boolean;
  alterations: SalaryAdvanceAlteration[];
}

export type ExportedFilter = "all" | "exported" | "not_exported";
export type AlteredFilter = "all" | "altered" | "not_altered";

export interface GetSalaryAdvanceDataProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  exportedFilter?: ExportedFilter;
  alteredFilter?: AlteredFilter;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, department, type, status).
const SEARCHABLE_COLUMNS = [
  "sa.staff_name",
  "sa.staff_number",
  "sa.staff_department",
  "sa.request_type",
  "sa.approval_status",
];

export async function GetSalaryAdvanceData({
  page = 1,
  pageSize = 6,
  searchTerm,
  exportedFilter = "all",
  alteredFilter = "all",
}: GetSalaryAdvanceDataProps = {}): Promise<PaginatedResult<SalaryAdvanceData>> {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  if (searchTerm?.trim()) {
    const searchClause = SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    baseParams.push(`%${searchTerm.trim()}%`);
    conditions.push(`(${searchClause})`);
  }

  if (exportedFilter === "exported") conditions.push("sa.exported = true");
  if (exportedFilter === "not_exported") conditions.push("sa.exported = false");
  if (alteredFilter === "altered") conditions.push("alt.alterations IS NOT NULL");
  if (alteredFilter === "not_altered") conditions.push("alt.alterations IS NULL");

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  const baseQuery = `
    SELECT
    sa.request_id, sa.request_created_at, sa.staff_number, sa.staff_name, sa.staff_email, sa.staff_department,
    sa.staff_location, sa.request_amount, sa.no_of_installments, sa.repayment_start_date,
    sa.request_type, sa.approval_status, sa.approver_comments, sa.exported,
    (alt.alterations IS NOT NULL) AS altered,
    COALESCE(alt.alterations, '[]'::json) AS alterations,
    COUNT(*) OVER() AS total_count
    FROM salary_advances sa
    ${alterationsJsonLateral("sa")}
    ${whereClause}
    ORDER BY sa.request_created_at DESC
    LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query<SalaryAdvanceData & { total_count: string }>(
      baseQuery,
      [...baseParams, limit, offset],
    );

    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error("Error while trying to fetch salary advance data:", error);
    return emptyPaginatedResult(page, pageSize);
  }
}
