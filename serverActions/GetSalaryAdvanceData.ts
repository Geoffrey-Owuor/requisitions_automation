"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";

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
}

export interface GetSalaryAdvanceDataProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, department, type, status).
const SEARCHABLE_COLUMNS = [
  "staff_name",
  "staff_number",
  "staff_department",
  "request_type",
  "approval_status",
];

export async function GetSalaryAdvanceData({
  page = 1,
  pageSize = 6,
  searchTerm,
}: GetSalaryAdvanceDataProps = {}): Promise<PaginatedResult<SalaryAdvanceData>> {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  const baseParams: (string | number)[] = [];
  let whereClause = "";

  if (searchTerm?.trim()) {
    const searchClause = SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    baseParams.push(`%${searchTerm.trim()}%`);
    whereClause = `WHERE ${searchClause}`;
  }

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  const baseQuery = `
    SELECT
    request_id, request_created_at, staff_number, staff_name, staff_email, staff_department,
    staff_location, request_amount, no_of_installments, repayment_start_date,
    request_type, approval_status, approver_comments,
    COUNT(*) OVER() AS total_count
    FROM salary_advances
    ${whereClause}
    ORDER BY request_created_at DESC
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
