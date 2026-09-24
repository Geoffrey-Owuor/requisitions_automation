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

export interface TravelRequisitionDataProps {
  dataFlag:
    | "userData"
    | "hodPending"
    | "hrPending"
    | "directorPending"
    | "history";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched against when a search term is supplied — mirrors what's
// visible in the table UI (employee, destination, mode, statuses, etc).
const SEARCHABLE_COLUMNS = [
  "employee_name",
  "travel_destination",
  "travel_mode",
  "travel_hod_approval_status",
  "travel_hr_approval_status",
  "travel_director_approval_status",
];

export const getTravelRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: TravelRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  // Travel HR/Director dashboard access is role-based — verify the role
  // server-side rather than trusting the dashboard's role gate.
  const roles = await getUserRoles(user.email);
  const isHr = roles.includes("hr-travel");
  const isDirector = roles.includes("director");
  if (dataFlag === "hrPending" && !isHr) {
    return emptyPaginatedResult(page, pageSize);
  }
  if (dataFlag === "directorPending" && !isDirector) {
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
      conditions.push(
        `travel_hod_email = $${baseParams.length + 1} AND travel_hod_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "hrPending":
      conditions.push(
        `travel_hod_approval_status = $${baseParams.length + 1} AND travel_hr_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push("approved", "pending");
      break;
    case "directorPending":
      conditions.push(
        `travel_hod_approval_status = $${baseParams.length + 1} AND travel_hr_approval_status = $${baseParams.length + 2} AND travel_director_approval_status = $${baseParams.length + 3}`,
      );
      baseParams.push("approved", "approved", "pending");
      break;
    case "history": {
      // Union of every stage this user is involved in: their own HOD rows,
      // plus (HR) everything the HOD approved and (Director) every Tier 3
      // request that has reached the Director stage.
      const scopes = [`travel_hod_email = $${baseParams.length + 1}`];
      baseParams.push(user.email);
      if (isHr) {
        scopes.push(`travel_hod_approval_status = $${baseParams.length + 1}`);
        baseParams.push("approved");
      }
      if (isDirector) {
        scopes.push(
          `(travel_hod_approval_status = $${baseParams.length + 1} AND travel_hr_approval_status = $${baseParams.length + 2} AND travel_director_approval_status <> $${baseParams.length + 3})`,
        );
        baseParams.push("approved", "approved", "N/A");
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
        request_id, request_created_at,
        employee_name, travel_destination, travel_departure_date,
        travel_return_date, travel_business_justification,
        travel_mode, travel_total_cost,
        travel_cost_center,
        travel_hod_approval_status, travel_hr_approval_status, travel_director_approval_status,
        COUNT(*) OVER() AS total_count
        FROM travel_requisitions
        ${whereClause}
        ORDER BY request_created_at DESC
        LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query(baseQuery, [...baseParams, limit, offset]);
    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error(
      "Error while trying to fetch travel requisition data:",
      error,
    );
    return emptyPaginatedResult(page, pageSize);
  }
};
