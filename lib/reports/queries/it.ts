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

// IT Requisitions: one row per requisition. The HOD stage approves/declines;
// the IT stage accepts/rejects, and an accepted request is later marked
// completed by the itrequisition-completion trigger. hod_approver_email is
// the assigned HOD, hod_approver_name and hod_actioned_by_email whoever
// acted (the assigned HOD or an alternate).

const IT_ACCEPTED = `r.it_approver_status IN ('accepted', 'approved')`;
const IT_REJECTED = `r.it_approver_status IN ('rejected', 'declined')`;

const STATUS_BUCKET = `CASE
  WHEN ${IT_ACCEPTED} THEN 'approved'
  WHEN r.hod_approver_status = 'declined' OR ${IT_REJECTED} THEN 'declined'
  ELSE 'pending'
END`;

const SQL = `
SELECT
  ${reference("r.request_id")}                 AS reference,
  ${excelDateTime("r.request_created_at")}     AS submitted_on,
  r.submitter_name,
  r.submitter_email,
  r.employee_name,
  r.employee_department,
  r.employee_staff_number,
  r.replacement_new,
  r.requirements,
  r.other_requirements,
  ${excelDate("r.requisition_date")}           AS requisition_date,
  ${excelDate("r.date_joining")}               AS date_joining,

  CASE
    WHEN r.hod_approver_status = 'declined' THEN 'Declined by HOD'
    WHEN ${IT_REJECTED} THEN 'Rejected by IT'
    WHEN ${IT_ACCEPTED} AND r.completion_status = 'completed' THEN 'Completed'
    WHEN ${IT_ACCEPTED} THEN 'Accepted by IT'
    WHEN r.hod_approver_status = 'pending' THEN 'Pending HOD'
    ELSE 'Pending IT'
  END                                          AS overall_status,

  INITCAP(r.hod_approver_status)               AS hod_status,
  r.hod_approver_email                         AS assigned_hod_email,
  CASE WHEN r.hod_approver_status <> 'pending' THEN r.hod_approver_name END AS hod_actioned_by,
  r.hod_actioned_by_email,
  ${excelDateTime("r.hod_approval_date")}      AS hod_action_date,
  r.hod_approver_comments                      AS hod_comments,

  INITCAP(r.it_approver_status)                AS it_status,
  r.it_approver_name                           AS it_actioned_by,
  r.it_approver_email                          AS it_actioned_by_email,
  ${excelDateTime("r.it_approval_date")}       AS it_action_date,
  r.it_approver_comments                       AS it_comments,
  CASE WHEN r.it_approval_date IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM r.it_approval_date - r.request_created_at) / 86400.0)::numeric, 1)
  END                                          AS days_to_it_decision,

  INITCAP(r.completion_status)                 AS completion_status,
  ${excelDateTime("r.date_completed")}         AS date_completed
FROM it_requisitions r
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
  { key: "replacement_new", header: "Replacement / New" },
  { key: "requirements", header: "Requirements", kind: "longtext" },
  { key: "other_requirements", header: "Other Requirements", kind: "longtext" },
  { key: "requisition_date", header: "Requisition Date", kind: "date" },
  { key: "date_joining", header: "Date Joining", kind: "date" },
  { key: "overall_status", header: "Overall Status" },
  { key: "hod_status", header: "HOD Status" },
  { key: "assigned_hod_email", header: "Assigned HOD Email" },
  { key: "hod_actioned_by", header: "HOD Actioned By" },
  { key: "hod_actioned_by_email", header: "HOD Actioned By Email" },
  { key: "hod_action_date", header: "HOD Action Date", kind: "datetime" },
  { key: "hod_comments", header: "HOD Comments", kind: "longtext" },
  { key: "it_status", header: "IT Status" },
  { key: "it_actioned_by", header: "IT Actioned By" },
  { key: "it_actioned_by_email", header: "IT Actioned By Email" },
  { key: "it_action_date", header: "IT Action Date", kind: "datetime" },
  { key: "it_comments", header: "IT Comments", kind: "longtext" },
  { key: "days_to_it_decision", header: "Days to IT Decision", kind: "decimal" },
  { key: "completion_status", header: "Completion Status" },
  { key: "date_completed", header: "Date Completed", kind: "datetime" },
];

export async function buildITReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const rows = await query(SQL, [from, to, status]);
  return [{ name: "IT Requisitions", columns: COLUMNS, rows }];
}
