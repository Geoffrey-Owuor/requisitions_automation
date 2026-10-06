import "server-only";
import { query } from "@/lib/db";
import type { ReportColumn, ReportSheet } from "@/lib/reports/workbook";
import {
  createdInRange,
  excelDate,
  excelDateTime,
  moneyText,
  nairobiText,
  reference,
  statusMatches,
} from "@/lib/reports/sql";
import type { ReportQueryParams } from "./types";

// Casual Requisitions: one row per section; the requisition's header,
// approvals and amendment summary repeat on each of its sections. Adapted
// from schemas/reports/Casual_Requisitions_Report.sql.
//
// - Removed sections have no row (they're deleted from the sections table);
//   their removal still shows in the amendment history and the totals.
// - Original totals come from the first amendment's "previous" figures, so
//   a never-amended requisition shows its current totals and a change of 0.
// - Days to HR Decision counts from the last amendment, since an amendment
//   restarts the approval chain.

const STATUS_BUCKET = `CASE
  WHEN c.casual_hr_approval_status = 'approved' THEN 'approved'
  WHEN c.casual_hod_approval_status = 'declined'
    OR c.casual_hr_approval_status = 'declined' THEN 'declined'
  ELSE 'pending'
END`;

const SQL = `
WITH scoped AS (
  SELECT c.* FROM casual_requisitions c
  WHERE ${createdInRange("c.request_created_at")}
    AND ${statusMatches(STATUS_BUCKET)}
),
request_totals AS (
  SELECT s.request_id,
         COUNT(*)                   AS section_count,
         SUM(s.number_of_casuals)   AS total_casuals,
         SUM(s.casual_total_amount) AS total_amount
  FROM casual_requisition_sections s
  JOIN scoped c ON c.request_id = s.request_id
  GROUP BY s.request_id
),
amendment_summary AS (
  SELECT
    a.request_id,
    (ARRAY_AGG(a.previous_total_casuals ORDER BY a.amendment_number))[1]      AS original_total_casuals,
    (ARRAY_AGG(a.previous_total_amount  ORDER BY a.amendment_number))[1]      AS original_total_amount,
    (ARRAY_AGG(a.amended_by_name        ORDER BY a.amendment_number DESC))[1] AS latest_amended_by,
    (ARRAY_AGG(a.amendment_reason       ORDER BY a.amendment_number DESC))[1] AS latest_reason,
    STRING_AGG(
      '#' || a.amendment_number
        || ' (' || ${nairobiText("a.created_at")} || ', ' || a.amended_by_name || '): '
        || a.amendment_reason
        || ' | Casuals ' || COALESCE(a.previous_total_casuals::text, '-')
        || ' -> '        || COALESCE(a.new_total_casuals::text, '-')
        || ', KES '      || COALESCE(${moneyText("a.previous_total_amount")}, '-')
        || ' -> '        || COALESCE(${moneyText("a.new_total_amount")}, '-')
        || CASE WHEN a.previous_department IS NOT NULL AND a.previous_department IS DISTINCT FROM a.new_department
                THEN ' | Dept: ' || a.previous_department || ' -> ' || COALESCE(a.new_department, '-') ELSE '' END
        || CASE WHEN a.previous_location IS NOT NULL AND a.previous_location IS DISTINCT FROM a.new_location
                THEN ' | Location: ' || a.previous_location || ' -> ' || COALESCE(a.new_location, '-') ELSE '' END
        || CASE WHEN a.previous_casual_category IS NOT NULL AND a.previous_casual_category IS DISTINCT FROM a.new_casual_category
                THEN ' | Category: ' || a.previous_casual_category || ' -> ' || COALESCE(a.new_casual_category, '-') ELSE '' END
        || CASE WHEN a.previous_hod_approver IS NOT NULL AND a.previous_hod_approver IS DISTINCT FROM a.new_hod_approver
                THEN ' | HOD: ' || a.previous_hod_approver || ' -> ' || COALESCE(a.new_hod_approver, '-') ELSE '' END
        || ' | Approvals reset (HOD ' || INITCAP(COALESCE(a.nullified_hod_status, '-'))
        || ', HR ' || INITCAP(COALESCE(a.nullified_hr_status, '-')) || ')',
      E'\\n' ORDER BY a.amendment_number
    ) AS amendment_history
  FROM casual_requisition_amendments a
  JOIN scoped c ON c.request_id = a.request_id
  GROUP BY a.request_id
),
section_changes AS (
  -- Sections are identified by (request_id, section_name), the same stable
  -- identity the amendment route uses
  SELECT
    a.request_id,
    acs.section_name,
    STRING_AGG(
      '#' || a.amendment_number || ' ' || INITCAP(acs.change_type)
        || CASE WHEN acs.previous_number_of_casuals IS DISTINCT FROM acs.new_number_of_casuals AND acs.change_type = 'modified'
                THEN ', casuals ' || acs.previous_number_of_casuals || ' -> ' || acs.new_number_of_casuals ELSE '' END
        || CASE WHEN (acs.previous_period_from IS DISTINCT FROM acs.new_period_from
                   OR acs.previous_period_to   IS DISTINCT FROM acs.new_period_to) AND acs.change_type = 'modified'
                THEN ', period ' || TO_CHAR(acs.previous_period_from, 'DD Mon') || '-' || TO_CHAR(acs.previous_period_to, 'DD Mon YYYY')
                  || ' -> '      || TO_CHAR(acs.new_period_from, 'DD Mon')      || '-' || TO_CHAR(acs.new_period_to, 'DD Mon YYYY') ELSE '' END
        || CASE WHEN acs.previous_rate_per_day IS DISTINCT FROM acs.new_rate_per_day AND acs.change_type = 'modified'
                THEN ', rate ' || ${moneyText("acs.previous_rate_per_day")} || ' -> ' || ${moneyText("acs.new_rate_per_day")} ELSE '' END
        || CASE WHEN acs.previous_total_amount IS DISTINCT FROM acs.new_total_amount AND acs.change_type = 'modified'
                THEN ', KES ' || ${moneyText("acs.previous_total_amount")} || ' -> ' || ${moneyText("acs.new_total_amount")} ELSE '' END
        || CASE WHEN acs.previous_justification IS DISTINCT FROM acs.new_justification AND acs.change_type = 'modified'
                THEN ', justification edited' ELSE '' END
        || CASE WHEN acs.previous_ppes_required IS DISTINCT FROM acs.new_ppes_required AND acs.change_type = 'modified'
                THEN ', PPEs edited' ELSE '' END,
      '; ' ORDER BY a.amendment_number
    ) AS section_change_history
  FROM casual_requisition_amendment_sections acs
  JOIN casual_requisition_amendments a ON a.amendment_id = acs.amendment_id
  JOIN scoped c ON c.request_id = a.request_id
  GROUP BY a.request_id, acs.section_name
)
SELECT
  ${reference("c.request_id")}                    AS reference,
  ${excelDateTime("c.request_created_at")}        AS submitted_on,
  c.submitter_name,
  c.submitter_email,
  c.employee_department,
  c.casual_location,
  c.casual_category,

  s.section_name,
  s.number_of_casuals,
  ${excelDate("s.engagement_period_from")}        AS engagement_from,
  ${excelDate("s.engagement_period_to")}          AS engagement_to,
  s.engagement_days,
  s.casual_rate_per_day,
  s.casual_total_amount,
  s.casual_justification,
  s.ppes_required,

  rt.section_count,
  rt.total_casuals,
  rt.total_amount,

  CASE
    WHEN c.casual_hr_approval_status  = 'approved' THEN 'Approved'
    WHEN c.casual_hod_approval_status = 'declined' THEN 'Declined by HOD'
    WHEN c.casual_hr_approval_status  = 'declined' THEN 'Declined by HR'
    WHEN c.casual_hod_approval_status = 'pending'  THEN 'Pending HOD'
    ELSE 'Pending HR'
  END                                             AS overall_status,

  INITCAP(c.casual_hod_approval_status)           AS hod_status,
  c.casual_hod_email                              AS assigned_hod_email,
  c.casual_hod_approver                           AS hod_actioned_by,
  ${excelDateTime("c.casual_hod_approval_date")}  AS hod_action_date,
  c.casual_hod_comments                           AS hod_comments,

  INITCAP(c.casual_hr_approval_status)            AS hr_status,
  c.casual_hr_approver                            AS hr_actioned_by,
  ${excelDateTime("c.casual_hr_approval_date")}   AS hr_action_date,
  c.casual_hr_comments                            AS hr_comments,
  CASE WHEN c.casual_hr_approval_date IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM c.casual_hr_approval_date
                  - GREATEST(c.request_created_at, COALESCE(c.last_amended_at, c.request_created_at))) / 86400.0)::numeric, 1)
  END                                             AS days_to_hr_decision,

  CASE WHEN c.amendment_count > 0 THEN 'Yes' ELSE 'No' END AS amended,
  c.amendment_count,
  ${excelDateTime("c.last_amended_at")}           AS last_amended_on,
  am.latest_amended_by,
  am.latest_reason,
  COALESCE(am.original_total_casuals, rt.total_casuals)  AS original_total_casuals,
  COALESCE(am.original_total_amount, rt.total_amount)    AS original_total_amount,
  rt.total_amount - COALESCE(am.original_total_amount, rt.total_amount) AS amount_change,
  sc.section_change_history,
  am.amendment_history
FROM scoped c
JOIN casual_requisition_sections s ON s.request_id  = c.request_id
JOIN request_totals rt             ON rt.request_id = c.request_id
LEFT JOIN amendment_summary am     ON am.request_id = c.request_id
LEFT JOIN section_changes sc       ON sc.request_id = c.request_id AND sc.section_name = s.section_name
ORDER BY c.request_created_at, c.request_id, s.section_name
`;

const COLUMNS: ReportColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "submitted_on", header: "Submitted On", kind: "datetime" },
  { key: "submitter_name", header: "Submitted By" },
  { key: "submitter_email", header: "Submitter Email" },
  { key: "employee_department", header: "Department" },
  { key: "casual_location", header: "Location" },
  { key: "casual_category", header: "Casual Category" },
  { key: "section_name", header: "Section" },
  { key: "number_of_casuals", header: "No. of Casuals", kind: "integer" },
  { key: "engagement_from", header: "Engagement From", kind: "date" },
  { key: "engagement_to", header: "Engagement To", kind: "date" },
  { key: "engagement_days", header: "Engagement Days", kind: "integer" },
  { key: "casual_rate_per_day", header: "Rate per Day (KES)", kind: "money" },
  { key: "casual_total_amount", header: "Section Total (KES)", kind: "money" },
  { key: "casual_justification", header: "Justification", kind: "longtext" },
  { key: "ppes_required", header: "PPEs Required", kind: "longtext" },
  { key: "section_count", header: "Sections in Requisition", kind: "integer" },
  { key: "total_casuals", header: "Requisition Total Casuals", kind: "integer" },
  { key: "total_amount", header: "Requisition Total (KES)", kind: "money" },
  { key: "overall_status", header: "Overall Status" },
  { key: "hod_status", header: "HOD Status" },
  { key: "assigned_hod_email", header: "Assigned HOD Email" },
  { key: "hod_actioned_by", header: "HOD Actioned By" },
  { key: "hod_action_date", header: "HOD Action Date", kind: "datetime" },
  { key: "hod_comments", header: "HOD Comments", kind: "longtext" },
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
  { key: "original_total_casuals", header: "Original Total Casuals", kind: "integer" },
  { key: "original_total_amount", header: "Original Total (KES)", kind: "money" },
  { key: "amount_change", header: "Amount Change (KES)", kind: "money" },
  { key: "section_change_history", header: "Section Amendment History", kind: "longtext" },
  { key: "amendment_history", header: "Full Amendment History", kind: "longtext" },
];

export async function buildCasualReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const rows = await query(SQL, [from, to, status]);
  return [{ name: "Casual Requisitions", columns: COLUMNS, rows }];
}
