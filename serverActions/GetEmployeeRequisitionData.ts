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

export interface EmployeeRequisitionDataProps {
  dataFlag:
    | "userData"
    | "hodPending"
    | "retailDirectorPending"
    | "directorPending"
    | "hrPending";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Membership check for the array-gated stages — Retail Director/Director/HR
// have no "assigned to me" column, so every member of the stage's array
// table sees the same rows once the prior stage has approved.
const MEMBERSHIP_QUERIES: Partial<Record<EmployeeRequisitionDataProps["dataFlag"], string>> = {
  retailDirectorPending:
    "SELECT 1 FROM retail_director_array WHERE retail_director_email = $1 LIMIT 1",
  directorPending:
    "SELECT 1 FROM director_array WHERE director_email = $1 LIMIT 1",
  hrPending:
    "SELECT 1 FROM hr_array WHERE hr_email = $1 AND 'employee' = ANY(hr_forms) LIMIT 1",
};

const SEARCHABLE_COLUMNS = [
  "e.employee_department",
  "e.submitter_name",
  "e.employee_hod_approval_status",
  "e.employee_retail_director_approval_status",
  "e.employee_director_approval_status",
  "e.employee_hr_approval_status",
];

export const getEmployeeRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: EmployeeRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  const membershipQuery = MEMBERSHIP_QUERIES[dataFlag];
  if (membershipQuery) {
    const membership = await query(membershipQuery, [user.email]);
    if (membership.length === 0) return emptyPaginatedResult(page, pageSize);
  }

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      conditions.push(`e.submitter_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
      break;
    case "hodPending":
      conditions.push(
        `e.employee_hod_email = $${baseParams.length + 1} AND e.employee_hod_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "retailDirectorPending":
      conditions.push(
        `e.employee_hod_approval_status = $${baseParams.length + 1} AND e.employee_retail_director_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push("approved", "pending");
      break;
    case "directorPending":
      conditions.push(
        `e.employee_hod_approval_status = $${baseParams.length + 1} AND e.employee_retail_director_approval_status IN ($${baseParams.length + 2}, $${baseParams.length + 3}) AND e.employee_director_approval_status = $${baseParams.length + 4}`,
      );
      baseParams.push("approved", "approved", "N/A", "pending");
      break;
    case "hrPending":
      conditions.push(
        `e.employee_hod_approval_status = $${baseParams.length + 1} AND e.employee_retail_director_approval_status IN ($${baseParams.length + 2}, $${baseParams.length + 3}) AND e.employee_director_approval_status = $${baseParams.length + 4} AND e.employee_hr_approval_status = $${baseParams.length + 5}`,
      );
      baseParams.push("approved", "approved", "N/A", "approved", "pending");
      break;
  }

  if (searchTerm?.trim()) {
    const term = `%${searchTerm.trim()}%`;
    const searchClause = SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    conditions.push(
      `(${searchClause} OR EXISTS (
        SELECT 1 FROM employee_requisition_positions p
        WHERE p.request_id = e.request_id AND p.position_title ILIKE $${baseParams.length + 1}
      ))`,
    );
    baseParams.push(term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  // One row per requisition — position-level headcount is rolled up via a
  // lateral aggregate so COUNT(*) OVER() pagination reflects requisitions,
  // not positions.
  const baseQuery = `
    SELECT
        e.request_id, e.request_created_at, e.submitter_email, e.submitter_name,
        e.employee_department,
        e.employee_hod_approval_status, e.employee_hod_approver,
        e.employee_retail_director_approval_status, e.employee_retail_director_approver,
        e.employee_director_approval_status, e.employee_director_approver,
        e.employee_hr_approval_status, e.employee_hr_approver,
        agg.total_positions, agg.total_headcount,
        COUNT(*) OVER() AS total_count
        FROM employee_requisitions e
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS total_positions, SUM(number_required) AS total_headcount
          FROM employee_requisition_positions p WHERE p.request_id = e.request_id
        ) agg ON TRUE
        ${whereClause}
        ORDER BY e.request_created_at DESC
        LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query(baseQuery, [...baseParams, limit, offset]);
    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error(
      "Error while trying to fetch employee requisition data:",
      error,
    );
    return emptyPaginatedResult(page, pageSize);
  }
};
