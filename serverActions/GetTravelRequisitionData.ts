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

export interface TravelRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "hrPending" | "directorPending";
  userEmail?: string;
  hodEmail?: string;
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
  userEmail,
  hodEmail,
  page = 1,
  pageSize = 6,
  searchTerm,
}: TravelRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      conditions.push(`submitter_email = $${baseParams.length + 1}`);
      baseParams.push(userEmail ?? "");
      break;
    case "hodPending":
      conditions.push(
        `travel_hod_email = $${baseParams.length + 1} AND travel_hod_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push(hodEmail ?? "", "pending");
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
