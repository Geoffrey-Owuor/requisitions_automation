import "server-only";
// Served by app/api/dashboard/tables/[type]/route.ts rather than as a server
// action — see that route for why.
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getApproverMemberships } from "@/serverActions/GetApproverMemberships";
import { hodHistoryScopeSql, hodPendingScopeSql } from "@/lib/hodAssignment";
import {
  PaginatedResult,
  emptyPaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { QueryResultRow } from "pg";

export interface ITRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "itPending" | "history";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, department, HOD/IT status, etc).
// Also used by the analytics Records view (lib/analytics/records/it.ts).
export const IT_SEARCHABLE_COLUMNS = [
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

// What a table row (and its details modal) needs; shared with the
// analytics Records view
export const IT_TABLE_COLUMNS = `request_id, request_created_at, submitter_email, submitter_name,
    employee_name, employee_department, employee_staff_number, replacement_new,
    requirements, other_requirements, requisition_date, date_joining, hod_approver_name,
    hod_approver_status, hod_approver_comments, hod_approval_date, it_approver_name,
    it_approver_status, it_approver_comments, it_approval_date, completion_status`;

export const getITRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: ITRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  // The IT queue and IT history expose every requisition that reached the
  // IT stage, so verify it_array membership server-side rather than
  // trusting the dashboard's gate.
  const isITApprover =
    dataFlag === "itPending" || dataFlag === "history"
      ? (await getApproverMemberships()).isITApprover
      : false;
  if (dataFlag === "itPending" && !isITApprover) {
    return emptyPaginatedResult(page, pageSize);
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
      // Assigned to me, or to a HOD I'm an alternate for
      conditions.push(
        `${hodPendingScopeSql("hod_approver_email", "submitter_email", `$${baseParams.length + 1}`)} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "itPending":
      conditions.push(
        `it_approver_status = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`,
      );
      baseParams.push("pending", "approved");
      break;
    case "history": {
      // Their own HOD rows (assigned, or acted on as an alternate), plus
      // (IT) everything the HOD approved, which reached the IT stage.
      // The full list, whatever its stage, is the IT analytics Records view.
      const scopes = [
        hodHistoryScopeSql(
          "hod_approver_email",
          "hod_actioned_by_email",
          `$${baseParams.length + 1}`,
        ),
      ];
      baseParams.push(user.email);
      if (isITApprover) {
        scopes.push(`hod_approver_status = $${baseParams.length + 1}`);
        baseParams.push("approved");
      }
      conditions.push(`(${scopes.join(" OR ")})`);
      break;
    }
  }

  if (searchTerm?.trim()) {
    const searchClause = IT_SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    conditions.push(`(${searchClause})`);
    baseParams.push(`%${searchTerm.trim()}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  const baseQuery = `
    SELECT ${IT_TABLE_COLUMNS},
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
    console.error("Error while trying to fetch IT requisition data:", error);
    return emptyPaginatedResult(page, pageSize);
  }
};
