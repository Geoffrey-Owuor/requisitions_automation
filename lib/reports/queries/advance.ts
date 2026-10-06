import "server-only";
import { query } from "@/lib/db";
import type { ReportColumn, ReportSheet } from "@/lib/reports/workbook";
import {
  createdInRange,
  excelDate,
  excelDateTime,
  reference,
  statusMatches,
} from "@/lib/reports/sql";
import type { ReportQueryParams } from "./types";

// Salary Advances: one row per request submitted in the range, plus an
// Alterations sheet of the self-service alterations made in the range (by
// the alteration's own date, like the HR export) whose request matches the
// status filter. Alteration rows only exist for requests that had already
// been exported; earlier changes edit the request in place, and deleted
// requests leave no trace (see CLAUDE.md, "Salary advance active-request lock").

const requestTypeLabel = (column: string) => `CASE ${column}
  WHEN 'oneoff' THEN 'One-off'
  WHEN 'continuous' THEN 'Continuous'
  ELSE INITCAP(${column})
END`;

const ADVANCES_SQL = `
SELECT
  ${reference("sa.request_id")}                 AS reference,
  ${excelDateTime("sa.request_created_at")}     AS submitted_on,
  sa.staff_number,
  sa.staff_name,
  sa.staff_email,
  sa.staff_department,
  sa.staff_location,
  sa.staff_phone_number,
  sa.request_amount,
  ${requestTypeLabel("sa.request_type")}        AS request_type,
  sa.no_of_installments,
  ${excelDate("sa.repayment_start_date")}       AS repayment_start_date,
  INITCAP(sa.approval_status)                   AS approval_status,
  sa.approver_comments,
  ${excelDateTime("sa.hr_reviewed_at")}         AS hr_reviewed_at,
  CASE WHEN sa.exported THEN 'Yes' ELSE 'No' END AS exported,
  CASE WHEN EXISTS (
    SELECT 1 FROM salary_advance_alterations a WHERE a.request_id = sa.request_id
  ) THEN 'Yes' ELSE 'No' END                    AS altered
FROM salary_advances sa
WHERE ${createdInRange("sa.request_created_at")}
  AND ${statusMatches("sa.approval_status")}
ORDER BY sa.request_created_at, sa.request_id
`;

const ALTERATIONS_SQL = `
SELECT
  ${excelDateTime("a.created_at")}              AS altered_on,
  ${reference("sa.request_id")}                 AS reference,
  ${excelDateTime("sa.request_created_at")}     AS request_submitted_on,
  sa.staff_number,
  sa.staff_name,
  sa.staff_email,
  CASE a.alteration_type
    WHEN 'switch_to_oneoff' THEN 'Switched to one-off'
    WHEN 'reduce_installments' THEN 'Reduced installments'
    ELSE INITCAP(REPLACE(a.alteration_type, '_', ' '))
  END                                           AS alteration_type,
  ${requestTypeLabel("a.previous_request_type")} AS previous_request_type,
  ${requestTypeLabel("a.new_request_type")}     AS new_request_type,
  a.previous_installments,
  a.new_installments,
  INITCAP(sa.approval_status)                   AS approval_status,
  CASE WHEN a.exported THEN 'Yes' ELSE 'No' END AS exported
FROM salary_advance_alterations a
JOIN salary_advances sa ON sa.request_id = a.request_id
WHERE ${createdInRange("a.created_at")}
  AND ${statusMatches("sa.approval_status")}
ORDER BY a.created_at, a.alteration_id
`;

const ADVANCE_COLUMNS: ReportColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "submitted_on", header: "Submitted On", kind: "datetime" },
  { key: "staff_number", header: "Staff Number" },
  { key: "staff_name", header: "Staff Name" },
  { key: "staff_email", header: "Staff Email" },
  { key: "staff_department", header: "Department" },
  { key: "staff_location", header: "Location" },
  { key: "staff_phone_number", header: "Phone Number" },
  { key: "request_amount", header: "Amount (KES)", kind: "money" },
  { key: "request_type", header: "Request Type" },
  { key: "no_of_installments", header: "Installments", kind: "integer" },
  { key: "repayment_start_date", header: "Repayment Start", kind: "date" },
  { key: "approval_status", header: "HR Status" },
  { key: "approver_comments", header: "HR Comments", kind: "longtext" },
  { key: "hr_reviewed_at", header: "HR Reviewed On", kind: "datetime" },
  { key: "exported", header: "Exported?" },
  { key: "altered", header: "Altered After Export?" },
];

const ALTERATION_COLUMNS: ReportColumn[] = [
  { key: "altered_on", header: "Altered On", kind: "datetime" },
  { key: "reference", header: "Request Reference" },
  { key: "request_submitted_on", header: "Request Submitted On", kind: "datetime" },
  { key: "staff_number", header: "Staff Number" },
  { key: "staff_name", header: "Staff Name" },
  { key: "staff_email", header: "Staff Email" },
  { key: "alteration_type", header: "Alteration" },
  { key: "previous_request_type", header: "Previous Request Type" },
  { key: "new_request_type", header: "New Request Type" },
  { key: "previous_installments", header: "Previous Installments", kind: "integer" },
  { key: "new_installments", header: "New Installments", kind: "integer" },
  { key: "approval_status", header: "Request HR Status" },
  { key: "exported", header: "Exported?" },
];

export async function buildAdvanceReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const params = [from, to, status];
  const [advances, alterations] = await Promise.all([
    query(ADVANCES_SQL, params),
    query(ALTERATIONS_SQL, params),
  ]);
  return [
    { name: "Salary Advances", columns: ADVANCE_COLUMNS, rows: advances },
    { name: "Alterations", columns: ALTERATION_COLUMNS, rows: alterations },
  ];
}
