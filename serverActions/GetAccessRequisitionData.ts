"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { QueryResultRow } from "pg";

export interface AccessRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "securityPending";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, department, locations, statuses, etc).
const SEARCHABLE_COLUMNS = [
  "employee_name",
  "employee_department",
  "employee_staff_number",
  "access_locations",
  "hod_approver_status",
  "security_approver_status",
];

export const getAccessRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: AccessRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  // Security is array-based (any member of security_array can act) — verify
  // membership server-side rather than trusting the dashboard's role gate.
  if (dataFlag === "securityPending") {
    const membership = await query(
      "SELECT 1 FROM security_array WHERE security_email = $1 LIMIT 1",
      [user.email],
    );
    if (membership.length === 0) return emptyPaginatedResult(page, pageSize);
  }

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      conditions.push(`submitter_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
      break;
    case "hodPending":
      conditions.push(
        `hod_approver_email = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "securityPending":
      conditions.push(
        `hod_approver_status = $${baseParams.length + 1} AND security_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push("approved", "pending");
      break;
  }

  if (searchTerm?.trim()) {
    const searchClause = SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    conditions.push(`(${searchClause})`);
    baseParams.push(`%${searchTerm.trim()}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  const baseQuery = `
    SELECT
        request_id, request_created_at, submitter_email,
        employee_name, employee_department, employee_staff_number,
        issuance_date, access_locations, access_requirements,
        hod_approver_name, hod_approver_status, hod_approver_comments,
        security_approver_name, security_approver_status, security_approver_comments,
        COUNT(*) OVER() AS total_count
        FROM access_requisitions
        ${whereClause}
        ORDER BY request_created_at DESC
        LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query(baseQuery, [...baseParams, limit, offset]);
    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error(
      "Error while trying to fetch access requisition data:",
      error,
    );
    return emptyPaginatedResult(page, pageSize);
  }
};
