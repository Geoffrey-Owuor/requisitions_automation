"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { QueryResultRow } from "pg";

export interface ITRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "itPending" | "itAll" | "history";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, department, HOD/IT status, etc).
const SEARCHABLE_COLUMNS = [
  "employee_name",
  "employee_department",
  "employee_staff_number",
  "submitter_name",
  "hod_approver_name",
  "it_approver_name",
  "hod_approver_status",
  "it_approver_status",
  "completion_status",
  "replacement_new",
];

export const getITRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: ITRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  // The IT queues expose every requisition, so verify the "it" role
  // server-side rather than trusting the dashboard's role gate.
  if (dataFlag === "itPending" || dataFlag === "itAll") {
    const roles = await getUserRoles(user.email);
    if (!roles.includes("it")) return emptyPaginatedResult(page, pageSize);
  }

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      // Identity is always the session's own email — never client-supplied,
      // so this can't be used to view another user's submissions.
      conditions.push(`submitter_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
      break;
    case "hodPending":
      conditions.push(
        `hod_approver_email = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "itPending":
      conditions.push(
        `it_approver_status = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push("pending", "approved");
      break;
    case "history":
      // HOD history — every requisition this user is the stored HOD for.
      // IT admins get the full history from itAll instead.
      conditions.push(`hod_approver_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
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
    SELECT request_id, request_created_at, submitter_email, submitter_name,
    employee_name, employee_department, employee_staff_number, replacement_new,
    requirements, other_requirements, requisition_date, date_joining, hod_approver_name,
    hod_approver_status, hod_approver_comments, hod_approval_date, it_approver_name,
    it_approver_status, it_approver_comments, it_approval_date, completion_status,
    COUNT(*) OVER() AS total_count
    FROM it_requisitions
    ${whereClause}
    ORDER BY request_created_at DESC
    LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query(baseQuery, [...baseParams, limit, offset]);
    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error(
      "Error while trying to fetch IT requisition data:",
      error,
    );
    return emptyPaginatedResult(page, pageSize);
  }
};
