import "server-only";
// Served by app/api/dashboard/tables/[type]/route.ts rather than as a server
// action — see that route for why.
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hodHistoryScopeSql, hodPendingScopeSql } from "@/lib/hodAssignment";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { QueryResultRow } from "pg";

export interface AccessRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "securityPending" | "history";
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
  let isSecurity = false;
  if (dataFlag === "securityPending" || dataFlag === "history") {
    const membership = await query(
      "SELECT 1 FROM security_array WHERE security_email = $1 LIMIT 1",
      [user.email],
    );
    isSecurity = membership.length > 0;
    if (dataFlag === "securityPending" && !isSecurity) {
      return emptyPaginatedResult(page, pageSize);
    }
  }

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      conditions.push(`submitter_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
      break;
    case "hodPending":
      // Assigned to me, or to a HOD I'm an alternate for
      conditions.push(
        `${hodPendingScopeSql("hod_approver_email", "submitter_email", `$${baseParams.length + 1}`)} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "securityPending":
      conditions.push(
        `hod_approver_status = $${baseParams.length + 1} AND security_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push("approved", "pending");
      break;
    case "history": {
      // Their own HOD rows (assigned, or acted on as an alternate), plus
      // (Security) everything the HOD approved.
      const scopes = [
        hodHistoryScopeSql(
          "hod_approver_email",
          "hod_actioned_by_email",
          `$${baseParams.length + 1}`,
        ),
      ];
      baseParams.push(user.email);
      if (isSecurity) {
        scopes.push(`hod_approver_status = $${baseParams.length + 1}`);
        baseParams.push("approved");
      }
      conditions.push(`(${scopes.join(" OR ")})`);
      break;
    }
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
