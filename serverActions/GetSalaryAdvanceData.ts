"use server";
import { query } from "@/lib/db";
import { getHrAdvanceSession } from "@/lib/salaryAdvanceAccess";
import {
  ADVANCE_SEARCHABLE_COLUMNS,
  ADVANCE_TABLE_COLUMNS,
  ADVANCE_TABLE_FROM,
} from "@/lib/salaryAdvanceTable";
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
  staff_phone_number: string | null;
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

export async function GetSalaryAdvanceData({
  page = 1,
  pageSize = 6,
  searchTerm,
  exportedFilter = "all",
  alteredFilter = "all",
}: GetSalaryAdvanceDataProps = {}): Promise<
  PaginatedResult<SalaryAdvanceData>
> {
  const user = await getHrAdvanceSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  if (searchTerm?.trim()) {
    const searchClause = ADVANCE_SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    baseParams.push(`%${searchTerm.trim()}%`);
    conditions.push(`(${searchClause})`);
  }

  if (exportedFilter === "exported") conditions.push("sa.exported = true");
  if (exportedFilter === "not_exported") conditions.push("sa.exported = false");
  if (alteredFilter === "altered")
    conditions.push("alt.alterations IS NOT NULL");
  if (alteredFilter === "not_altered")
    conditions.push("alt.alterations IS NULL");

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  const baseQuery = `
    SELECT ${ADVANCE_TABLE_COLUMNS},
    COUNT(*) OVER() AS total_count
    FROM ${ADVANCE_TABLE_FROM}
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
