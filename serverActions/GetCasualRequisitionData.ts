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

export interface CasualRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "hrPending" | "history";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Columns matched (on the header row) when a search term is supplied —
// section names are matched separately via an EXISTS subquery below since
// they live in the child casual_requisition_sections table.
const SEARCHABLE_COLUMNS = [
  "c.employee_department",
  "c.casual_location",
  "c.casual_hod_approval_status",
  "c.casual_hr_approval_status",
];

export const getCasualRequisitionData = async ({
  dataFlag,
  page = 1,
  pageSize = 6,
  searchTerm,
}: CasualRequisitionDataProps): Promise<PaginatedResult<QueryResultRow>> => {
  const user = await getSession();
  if (!user) return emptyPaginatedResult(page, pageSize);

  // HR is array-based and form-scoped — verify this approver is actually
  // permitted to act on casual requisitions rather than trusting a role.
  let isHr = false;
  if (dataFlag === "hrPending" || dataFlag === "history") {
    const membership = await query(
      "SELECT 1 FROM hr_array WHERE hr_email = $1 AND 'casual' = ANY(hr_forms) LIMIT 1",
      [user.email],
    );
    isHr = membership.length > 0;
    if (dataFlag === "hrPending" && !isHr) {
      return emptyPaginatedResult(page, pageSize);
    }
  }

  const baseParams: (string | number)[] = [];
  const conditions: string[] = [];

  switch (dataFlag) {
    case "userData":
      conditions.push(`c.submitter_email = $${baseParams.length + 1}`);
      baseParams.push(user.email);
      break;
    case "hodPending":
      // Assigned to me, or to a HOD I'm an alternate for
      conditions.push(
        `${hodPendingScopeSql("c.casual_hod_email", "c.submitter_email", `$${baseParams.length + 1}`)} AND c.casual_hod_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push(user.email, "pending");
      break;
    case "hrPending":
      conditions.push(
        `c.casual_hod_approval_status = $${baseParams.length + 1} AND c.casual_hr_approval_status = $${baseParams.length + 2}`,
      );
      baseParams.push("approved", "pending");
      break;
    case "history": {
      // Their own (current stored) HOD rows, plus (HR) everything the HOD
      // approved.
      // HOD rows: assigned to me, or acted on by me as an alternate HOD
      const scopes = [
        hodHistoryScopeSql(
          "c.casual_hod_email",
          "c.casual_hod_actioned_by_email",
          `$${baseParams.length + 1}`,
        ),
      ];
      baseParams.push(user.email);
      if (isHr) {
        scopes.push(`c.casual_hod_approval_status = $${baseParams.length + 1}`);
        baseParams.push("approved");
      }
      conditions.push(`(${scopes.join(" OR ")})`);
      break;
    }
  }

  if (searchTerm?.trim()) {
    const term = `%${searchTerm.trim()}%`;
    const searchClause = SEARCHABLE_COLUMNS.map(
      (col) => `${col}::text ILIKE $${baseParams.length + 1}`,
    ).join(" OR ");
    conditions.push(
      `(${searchClause} OR EXISTS (
        SELECT 1 FROM casual_requisition_sections s
        WHERE s.request_id = c.request_id AND s.section_name ILIKE $${baseParams.length + 1}
      ))`,
    );
    baseParams.push(term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });

  // One row per requisition — section-level headcount/amount/date fields
  // are rolled up via a lateral aggregate so COUNT(*) OVER() pagination
  // still reflects the number of requisitions, not sections.
  const baseQuery = `
    SELECT
        c.request_id, c.request_created_at, c.submitter_email, c.submitter_name,
        c.employee_department, c.casual_location,
        c.casual_hod_approval_status, c.casual_hr_approval_status,
        c.casual_hod_approver, c.casual_hr_approver,
        c.amendment_count, c.last_amended_at,
        agg.section_count, agg.total_casuals,
        agg.total_amount, agg.period_from, agg.period_to,
        COUNT(*) OVER() AS total_count
        FROM casual_requisitions c
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS section_count,
            SUM(number_of_casuals) AS total_casuals,
            SUM(casual_total_amount) AS total_amount,
            MIN(engagement_period_from) AS period_from,
            MAX(engagement_period_to) AS period_to
          FROM casual_requisition_sections s WHERE s.request_id = c.request_id
        ) agg ON TRUE
        ${whereClause}
        ORDER BY GREATEST(c.request_created_at, c.last_amended_at) DESC
        LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

  try {
    const result = await query(baseQuery, [...baseParams, limit, offset]);
    return toPaginatedResult(result, page, pageSize);
  } catch (error) {
    console.error(
      "Error while trying to fetch casual requisition data:",
      error,
    );
    return emptyPaginatedResult(page, pageSize);
  }
};
