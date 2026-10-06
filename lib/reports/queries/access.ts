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

// Key & Access Requisitions: one row per requisition (HOD -> Security).
// hod_approver_email is the assigned HOD, hod_approver_name and
// hod_actioned_by_email whoever acted (the assigned HOD or an alternate).
// Some early rows predate the 'pending' column defaults and hold NULL.

const HOD_STATUS = `COALESCE(r.hod_approver_status, 'pending')`;
const SECURITY_STATUS = `COALESCE(r.security_approver_status, 'pending')`;

const STATUS_BUCKET = `CASE
  WHEN ${SECURITY_STATUS} = 'approved' THEN 'approved'
  WHEN ${HOD_STATUS} = 'declined'
    OR ${SECURITY_STATUS} = 'declined' THEN 'declined'
  ELSE 'pending'
END`;

const SQL = `
SELECT
  ${reference("r.request_id")}                     AS reference,
  ${excelDateTime("r.request_created_at")}         AS submitted_on,
  r.submitter_name,
  r.submitter_email,
  r.employee_name,
  r.employee_department,
  r.employee_staff_number,
  ${excelDate("r.issuance_date")}                  AS issuance_date,
  r.access_locations,
  r.access_requirements,

  CASE
    WHEN ${SECURITY_STATUS} = 'approved' THEN 'Approved'
    WHEN ${HOD_STATUS} = 'declined' THEN 'Declined by HOD'
    WHEN ${SECURITY_STATUS} = 'declined' THEN 'Declined by Security'
    WHEN ${HOD_STATUS} = 'pending' THEN 'Pending HOD'
    ELSE 'Pending Security'
  END                                              AS overall_status,

  INITCAP(${HOD_STATUS})                   AS hod_status,
  r.hod_approver_email                             AS assigned_hod_email,
  CASE WHEN ${HOD_STATUS} <> 'pending' THEN r.hod_approver_name END AS hod_actioned_by,
  r.hod_actioned_by_email,
  ${excelDateTime("r.hod_approval_date")}          AS hod_action_date,
  r.hod_approver_comments                          AS hod_comments,

  INITCAP(${SECURITY_STATUS})              AS security_status,
  r.security_approver_name                         AS security_actioned_by,
  r.security_approver_email                        AS security_actioned_by_email,
  ${excelDateTime("r.security_approval_date")}     AS security_action_date,
  r.security_approver_comments                     AS security_comments,
  CASE WHEN r.security_approval_date IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM r.security_approval_date - r.request_created_at) / 86400.0)::numeric, 1)
  END                                              AS days_to_security_decision
FROM access_requisitions r
WHERE ${createdInRange("r.request_created_at")}
  AND ${statusMatches(STATUS_BUCKET)}
ORDER BY r.request_created_at, r.request_id
`;

const COLUMNS: ReportColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "submitted_on", header: "Submitted On", kind: "datetime" },
  { key: "submitter_name", header: "Submitted By" },
  { key: "submitter_email", header: "Submitter Email" },
  { key: "employee_name", header: "Employee Name" },
  { key: "employee_department", header: "Department" },
  { key: "employee_staff_number", header: "Staff Number" },
  { key: "issuance_date", header: "Issuance Date", kind: "date" },
  { key: "access_locations", header: "Locations", kind: "longtext" },
  { key: "access_requirements", header: "Requirements", kind: "longtext" },
  { key: "overall_status", header: "Overall Status" },
  { key: "hod_status", header: "HOD Status" },
  { key: "assigned_hod_email", header: "Assigned HOD Email" },
  { key: "hod_actioned_by", header: "HOD Actioned By" },
  { key: "hod_actioned_by_email", header: "HOD Actioned By Email" },
  { key: "hod_action_date", header: "HOD Action Date", kind: "datetime" },
  { key: "hod_comments", header: "HOD Comments", kind: "longtext" },
  { key: "security_status", header: "Security Status" },
  { key: "security_actioned_by", header: "Security Actioned By" },
  { key: "security_actioned_by_email", header: "Security Actioned By Email" },
  { key: "security_action_date", header: "Security Action Date", kind: "datetime" },
  { key: "security_comments", header: "Security Comments", kind: "longtext" },
  { key: "days_to_security_decision", header: "Days to Security Decision", kind: "decimal" },
];

export async function buildAccessReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const rows = await query(SQL, [from, to, status]);
  return [{ name: "Key & Access Requisitions", columns: COLUMNS, rows }];
}
