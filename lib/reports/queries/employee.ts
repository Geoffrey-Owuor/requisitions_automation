import "server-only";
import { query } from "@/lib/db";
import type { ReportColumn, ReportSheet } from "@/lib/reports/workbook";
import {
  EMPLOYEE_ATTACHMENT_TYPE_LABELS,
  parseSalaryRange,
} from "@/public/assets";
import {
  createdInRange,
  excelDate,
  excelDateTime,
  nairobiText,
  reference,
  statusMatches,
} from "@/lib/reports/sql";
import type { ReportQueryParams } from "./types";

// Employee Requisitions: one row per position; the requisition's header,
// approvals and amendment summary repeat on each of its positions.
// HOD -> Retail Director (retail departments only, 'N/A' otherwise) ->
// Director (labelled CEO, as in the dashboard and emails) -> HR.
//
// - Removed positions have no row; their removal still shows in the full
//   amendment history. Attachment columns list the current files' names
//   (the files themselves stay in the app).
// - Days to HR Decision counts from the last amendment, since an amendment
//   restarts the approval chain.

const STAGES = [
  "r.employee_hod_approval_status",
  "r.employee_retail_director_approval_status",
  "r.employee_director_approval_status",
  "r.employee_hr_approval_status",
].join(", ");

const STATUS_BUCKET = `CASE
  WHEN 'declined' IN (${STAGES}) THEN 'declined'
  WHEN 'pending' IN (${STAGES}) THEN 'pending'
  ELSE 'approved'
END`;

// 'N/A' (Retail Director skipped) stays as is; everything else title-cased
const stageStatus = (column: string) =>
  `COALESCE(INITCAP(NULLIF(${column}, 'N/A')), ${column})`;

const attachmentLabel = (column: string) => `CASE ${column}
${Object.entries(EMPLOYEE_ATTACHMENT_TYPE_LABELS)
  .map(([type, label]) => `  WHEN '${type}' THEN '${label}'`)
  .join("\n")}
  ELSE ${column}
END`;

const attachmentFile = (type: string) =>
  `MAX(at.original_filename) FILTER (WHERE at.attachment_type = '${type}')`;

const SQL = `
WITH scoped AS (
  SELECT r.* FROM employee_requisitions r
  WHERE ${createdInRange("r.request_created_at")}
    AND ${statusMatches(STATUS_BUCKET)}
),
request_totals AS (
  SELECT p.request_id,
         COUNT(*)              AS position_count,
         SUM(p.number_required) AS total_required
  FROM employee_requisition_positions p
  JOIN scoped r ON r.request_id = p.request_id
  GROUP BY p.request_id
),
position_files AS (
  SELECT
    at.position_id,
    ${attachmentFile("job-description")} AS job_description_file,
    ${attachmentFile("kpis")}            AS kpis_file,
    ${attachmentFile("org-chart")}       AS org_chart_file
  FROM employee_requisition_attachments at
  JOIN scoped r ON r.request_id = at.request_id
  GROUP BY at.position_id
),
amendment_summary AS (
  SELECT
    a.request_id,
    (ARRAY_AGG(a.amended_by_name  ORDER BY a.amendment_number DESC))[1] AS latest_amended_by,
    (ARRAY_AGG(a.amendment_reason ORDER BY a.amendment_number DESC))[1] AS latest_reason,
    STRING_AGG(
      '#' || a.amendment_number
        || ' (' || ${nairobiText("a.created_at")} || ', ' || a.amended_by_name || '): '
        || a.amendment_reason
        || ' | Positions ' || a.previous_total_positions || ' -> ' || a.new_total_positions
        || ', required ' || a.previous_total_required || ' -> ' || a.new_total_required
        || CASE WHEN a.previous_department IS NOT NULL AND a.previous_department IS DISTINCT FROM a.new_department
                THEN ' | Dept: ' || a.previous_department || ' -> ' || COALESCE(a.new_department, '-') ELSE '' END
        || CASE WHEN a.previous_hod_approver IS NOT NULL AND a.previous_hod_approver IS DISTINCT FROM a.new_hod_approver
                THEN ' | HOD: ' || a.previous_hod_approver || ' -> ' || COALESCE(a.new_hod_approver, '-') ELSE '' END
        || COALESCE(' | Positions changed: ' || (
             SELECT STRING_AGG(INITCAP(ap.change_type) || ' ' || ap.position_title, ', '
                               ORDER BY ap.change_type, ap.position_title)
             FROM employee_requisition_amendment_positions ap
             WHERE ap.amendment_id = a.amendment_id
           ), '')
        || ' | Approvals reset (HOD ' || ${stageStatus("COALESCE(a.nullified_hod_status, '-')")}
        || ', Retail Director ' || ${stageStatus("COALESCE(a.nullified_retail_director_status, '-')")}
        || ', CEO ' || ${stageStatus("COALESCE(a.nullified_director_status, '-')")}
        || ', HR ' || ${stageStatus("COALESCE(a.nullified_hr_status, '-')")} || ')',
      E'\\n' ORDER BY a.amendment_number
    ) AS amendment_history
  FROM employee_requisition_amendments a
  JOIN scoped r ON r.request_id = a.request_id
  GROUP BY a.request_id
),
position_changes AS (
  -- Added/modified positions keep their position_id; removed ones have no row
  SELECT
    ap.position_id,
    STRING_AGG(
      '#' || a.amendment_number || ' ' || INITCAP(ap.change_type)
        || CASE WHEN ap.change_type = 'modified' THEN
                CASE WHEN ap.previous_title IS DISTINCT FROM ap.new_title
                     THEN ', title ' || ap.previous_title || ' -> ' || ap.new_title ELSE '' END
             || CASE WHEN ap.previous_number_required IS DISTINCT FROM ap.new_number_required
                     THEN ', required ' || ap.previous_number_required || ' -> ' || ap.new_number_required ELSE '' END
             || CASE WHEN ap.previous_replacement_or_new IS DISTINCT FROM ap.new_replacement_or_new
                     THEN ', ' || ap.previous_replacement_or_new || ' -> ' || ap.new_replacement_or_new ELSE '' END
             || CASE WHEN ap.previous_job_grade IS DISTINCT FROM ap.new_job_grade
                     THEN ', grade ' || ap.previous_job_grade || ' -> ' || ap.new_job_grade ELSE '' END
             || CASE WHEN ap.previous_salary_range IS DISTINCT FROM ap.new_salary_range
                     THEN ', salary ' || ap.previous_salary_range || ' -> ' || ap.new_salary_range ELSE '' END
             || CASE WHEN ap.previous_reporting_to IS DISTINCT FROM ap.new_reporting_to
                     THEN ', reporting to ' || ap.previous_reporting_to || ' -> ' || ap.new_reporting_to ELSE '' END
             || CASE WHEN ap.previous_date_filled IS DISTINCT FROM ap.new_date_filled
                     THEN ', fill by ' || TO_CHAR(ap.previous_date_filled, 'DD Mon YYYY') || ' -> ' || TO_CHAR(ap.new_date_filled, 'DD Mon YYYY') ELSE '' END
             || CASE WHEN ap.previous_justification IS DISTINCT FROM ap.new_justification
                     THEN ', justification edited' ELSE '' END
           ELSE '' END
        || COALESCE(', files ' || (
             SELECT STRING_AGG(${attachmentLabel("aa.attachment_type")} || ' ' || aa.change_type, ', '
                               ORDER BY aa.attachment_type)
             FROM employee_requisition_amendment_attachments aa
             WHERE aa.amendment_position_id = ap.amendment_position_id
           ), ''),
      '; ' ORDER BY a.amendment_number
    ) AS position_change_history
  FROM employee_requisition_amendment_positions ap
  JOIN employee_requisition_amendments a ON a.amendment_id = ap.amendment_id
  JOIN scoped r ON r.request_id = a.request_id
  WHERE ap.position_id IS NOT NULL
  GROUP BY ap.position_id
)
SELECT
  ${reference("r.request_id")}                       AS reference,
  ${excelDateTime("r.request_created_at")}           AS submitted_on,
  r.submitter_name,
  r.submitter_email,
  r.employee_department,

  p.position_title,
  p.number_required,
  p.position_replacement_or_new,
  p.position_job_grade,
  p.position_salary_range,
  p.position_reporting_to,
  ${excelDate("p.date_position_filled")}             AS date_position_filled,
  p.position_justification,
  pf.job_description_file,
  pf.kpis_file,
  pf.org_chart_file,

  rt.position_count,
  rt.total_required,

  CASE
    WHEN r.employee_hod_approval_status             = 'declined' THEN 'Declined by HOD'
    WHEN r.employee_retail_director_approval_status = 'declined' THEN 'Declined by Retail Director'
    WHEN r.employee_director_approval_status        = 'declined' THEN 'Declined by CEO'
    WHEN r.employee_hr_approval_status              = 'declined' THEN 'Declined by HR'
    WHEN r.employee_hod_approval_status             = 'pending'  THEN 'Pending HOD'
    WHEN r.employee_retail_director_approval_status = 'pending'  THEN 'Pending Retail Director'
    WHEN r.employee_director_approval_status        = 'pending'  THEN 'Pending CEO'
    WHEN r.employee_hr_approval_status              = 'pending'  THEN 'Pending HR'
    ELSE 'Approved'
  END                                                AS overall_status,

  ${stageStatus("r.employee_hod_approval_status")}   AS hod_status,
  r.employee_hod_email                               AS assigned_hod_email,
  CASE WHEN r.employee_hod_approval_status <> 'pending' THEN r.employee_hod_approver END AS hod_actioned_by,
  r.employee_hod_actioned_by_email                   AS hod_actioned_by_email,
  ${excelDateTime("r.employee_hod_approval_date")}   AS hod_action_date,
  r.employee_hod_comments                            AS hod_comments,

  ${stageStatus("r.employee_retail_director_approval_status")} AS retail_director_status,
  r.employee_retail_director_approver                AS retail_director_actioned_by,
  ${excelDateTime("r.employee_retail_director_approval_date")} AS retail_director_action_date,
  r.employee_retail_director_comments                AS retail_director_comments,

  ${stageStatus("r.employee_director_approval_status")} AS director_status,
  r.employee_director_approver                       AS director_actioned_by,
  ${excelDateTime("r.employee_director_approval_date")} AS director_action_date,
  r.employee_director_comments                       AS director_comments,

  ${stageStatus("r.employee_hr_approval_status")}    AS hr_status,
  r.employee_hr_approver                             AS hr_actioned_by,
  ${excelDateTime("r.employee_hr_approval_date")}    AS hr_action_date,
  r.employee_hr_comments                             AS hr_comments,
  CASE WHEN r.employee_hr_approval_date IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM r.employee_hr_approval_date
                  - COALESCE(r.last_amended_at, r.request_created_at)) / 86400.0)::numeric, 1)
  END                                                AS days_to_hr_decision,

  CASE WHEN r.amendment_count > 0 THEN 'Yes' ELSE 'No' END AS amended,
  r.amendment_count,
  ${excelDateTime("r.last_amended_at")}              AS last_amended_on,
  am.latest_amended_by,
  am.latest_reason,
  pc.position_change_history,
  am.amendment_history
FROM scoped r
JOIN employee_requisition_positions p ON p.request_id  = r.request_id
JOIN request_totals rt                ON rt.request_id = r.request_id
LEFT JOIN position_files pf           ON pf.position_id = p.position_id
LEFT JOIN amendment_summary am        ON am.request_id = r.request_id
LEFT JOIN position_changes pc         ON pc.position_id = p.position_id
ORDER BY r.request_created_at, r.request_id, p.position_created_at, p.position_title
`;

const COLUMNS: ReportColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "submitted_on", header: "Submitted On", kind: "datetime" },
  { key: "submitter_name", header: "Submitted By" },
  { key: "submitter_email", header: "Submitter Email" },
  { key: "employee_department", header: "Department" },
  { key: "position_title", header: "Position" },
  { key: "number_required", header: "No. Required", kind: "integer" },
  { key: "position_replacement_or_new", header: "Replacement / New" },
  { key: "position_job_grade", header: "Job Grade" },
  { key: "position_salary_range", header: "Salary Range (KES)" },
  { key: "salary_min", header: "Salary Min (KES)", kind: "money" },
  { key: "salary_max", header: "Salary Max (KES)", kind: "money" },
  { key: "position_reporting_to", header: "Reporting To" },
  { key: "date_position_filled", header: "Fill By", kind: "date" },
  { key: "position_justification", header: "Justification", kind: "longtext" },
  { key: "job_description_file", header: "Job Description File" },
  { key: "kpis_file", header: "KPIs File" },
  { key: "org_chart_file", header: "Org Chart File" },
  { key: "position_count", header: "Positions in Requisition", kind: "integer" },
  { key: "total_required", header: "Requisition Total Required", kind: "integer" },
  { key: "overall_status", header: "Overall Status" },
  { key: "hod_status", header: "HOD Status" },
  { key: "assigned_hod_email", header: "Assigned HOD Email" },
  { key: "hod_actioned_by", header: "HOD Actioned By" },
  { key: "hod_actioned_by_email", header: "HOD Actioned By Email" },
  { key: "hod_action_date", header: "HOD Action Date", kind: "datetime" },
  { key: "hod_comments", header: "HOD Comments", kind: "longtext" },
  { key: "retail_director_status", header: "Retail Director Status" },
  { key: "retail_director_actioned_by", header: "Retail Director Actioned By" },
  { key: "retail_director_action_date", header: "Retail Director Action Date", kind: "datetime" },
  { key: "retail_director_comments", header: "Retail Director Comments", kind: "longtext" },
  { key: "director_status", header: "CEO Status" },
  { key: "director_actioned_by", header: "CEO Actioned By" },
  { key: "director_action_date", header: "CEO Action Date", kind: "datetime" },
  { key: "director_comments", header: "CEO Comments", kind: "longtext" },
  { key: "hr_status", header: "HR Status" },
  { key: "hr_actioned_by", header: "HR Actioned By" },
  { key: "hr_action_date", header: "HR Action Date", kind: "datetime" },
  { key: "hr_comments", header: "HR Comments", kind: "longtext" },
  { key: "days_to_hr_decision", header: "Days to HR Decision", kind: "decimal" },
  { key: "amended", header: "Amended?" },
  { key: "amendment_count", header: "Amendment Count", kind: "integer" },
  { key: "last_amended_on", header: "Last Amended On", kind: "datetime" },
  { key: "latest_amended_by", header: "Last Amended By" },
  { key: "latest_reason", header: "Latest Amendment Reason", kind: "longtext" },
  { key: "position_change_history", header: "Position Amendment History", kind: "longtext" },
  { key: "amendment_history", header: "Full Amendment History", kind: "longtext" },
];

export async function buildEmployeeReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const rows = await query(SQL, [from, to, status]);
  // Salary ranges are stored as "<min> - <max>" (or "<min> to <max>" on
  // some early rows); split them so the bounds are numbers in Excel
  const withSalary = rows.map((row) => {
    const range = parseSalaryRange(String(row.position_salary_range ?? ""));
    return { ...row, salary_min: range?.min, salary_max: range?.max };
  });
  return [{ name: "Employee Requisitions", columns: COLUMNS, rows: withSalary }];
}
