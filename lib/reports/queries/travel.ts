import "server-only";
import { query } from "@/lib/db";
import type { ReportColumn, ReportSheet } from "@/lib/reports/workbook";
import { TRAVEL_AMENDMENT_FIELDS } from "@/lib/travelAmendment";
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

// Travel Requisitions: one row per requisition (HOD -> HR, plus Director for
// Tier 3; Director is 'N/A' otherwise). HR push-backs and submitter
// amendments are summarised as text columns, one line per event.
//
// - travel_hod_email is the assigned HOD; travel_hod_approver and
//   travel_hod_actioned_by_email are whoever acted.
// - Original total/tier come from the first amendment's "previous" figures.
// - Days to HR Decision counts from the last amendment, since an amendment
//   restarts the approval chain (a push-back rewrites the HR decision date).

const STATUS_BUCKET = `CASE
  WHEN 'declined' IN (r.travel_hod_approval_status, r.travel_hr_approval_status, r.travel_director_approval_status)
    THEN 'declined'
  WHEN 'pending' IN (r.travel_hod_approval_status, r.travel_hr_approval_status, r.travel_director_approval_status)
    THEN 'pending'
  ELSE 'approved'
END`;

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

// "Destination (Nairobi -> Mombasa)", or "Business Justification edited"
// for long text, using the labels the amendment history UI shows
const AMENDED_FIELD_TEXT = `CASE f.field_key
${TRAVEL_AMENDMENT_FIELDS.map(({ key, label, kind }) =>
  kind === "longtext"
    ? `  WHEN ${sqlString(key)} THEN ${sqlString(`${label} edited`)}`
    : `  WHEN ${sqlString(key)} THEN ${sqlString(label)} || ' (' || COALESCE(NULLIF(f.previous_value, ''), '-') || ' -> ' || COALESCE(NULLIF(f.new_value, ''), '-') || ')'`,
).join("\n")}
  ELSE f.field_key
END`;

const FIELD_ORDER = `ARRAY[${TRAVEL_AMENDMENT_FIELDS.map(({ key }) => sqlString(key)).join(", ")}]::text[]`;

const SQL = `
WITH scoped AS (
  SELECT r.* FROM travel_requisitions r
  WHERE ${createdInRange("r.request_created_at")}
    AND ${statusMatches(STATUS_BUCKET)}
),
pushback_summary AS (
  SELECT
    p.request_id,
    STRING_AGG(
      '#' || p.pushback_number
        || ' (' || ${nairobiText("p.created_at")} || ', ' || p.pushed_by_name || '): '
        || INITCAP(p.previous_status) || ' -> ' || INITCAP(p.new_status)
        || ' | ' || p.pushback_reason,
      E'\\n' ORDER BY p.pushback_number
    ) AS pushback_history
  FROM travel_hr_pushbacks p
  JOIN scoped r ON r.request_id = p.request_id
  GROUP BY p.request_id
),
amendment_fields AS (
  SELECT
    f.amendment_id,
    STRING_AGG(${AMENDED_FIELD_TEXT}, '; '
      ORDER BY array_position(${FIELD_ORDER}, f.field_key::text)) AS changed_fields
  FROM travel_requisition_amendment_fields f
  JOIN travel_requisition_amendments a ON a.amendment_id = f.amendment_id
  JOIN scoped r ON r.request_id = a.request_id
  GROUP BY f.amendment_id
),
amendment_summary AS (
  SELECT
    a.request_id,
    (ARRAY_AGG(a.previous_total_cost    ORDER BY a.amendment_number))[1]      AS original_total_cost,
    (ARRAY_AGG(a.previous_approval_tier ORDER BY a.amendment_number))[1]      AS original_tier,
    (ARRAY_AGG(a.amended_by_name        ORDER BY a.amendment_number DESC))[1] AS latest_amended_by,
    (ARRAY_AGG(a.amendment_reason       ORDER BY a.amendment_number DESC))[1] AS latest_reason,
    STRING_AGG(
      '#' || a.amendment_number
        || ' (' || ${nairobiText("a.created_at")} || ', ' || a.amended_by_name || '): '
        || a.amendment_reason
        || ' | KES ' || ${moneyText("a.previous_total_cost")} || ' -> ' || ${moneyText("a.new_total_cost")}
        || CASE WHEN a.previous_approval_tier IS DISTINCT FROM a.new_approval_tier
                THEN ' | ' || a.previous_approval_tier || ' -> ' || a.new_approval_tier ELSE '' END
        || COALESCE(' | Changed: ' || af.changed_fields, '')
        || ' | Approvals reset (HOD ' || INITCAP(COALESCE(a.nullified_hod_status, '-'))
        || ', HR ' || INITCAP(COALESCE(a.nullified_hr_status, '-'))
        || ', Director ' || COALESCE(INITCAP(NULLIF(a.nullified_director_status, 'N/A')), a.nullified_director_status, '-') || ')',
      E'\\n' ORDER BY a.amendment_number
    ) AS amendment_history
  FROM travel_requisition_amendments a
  JOIN scoped r ON r.request_id = a.request_id
  LEFT JOIN amendment_fields af ON af.amendment_id = a.amendment_id
  GROUP BY a.request_id
)
SELECT
  ${reference("r.request_id")}                    AS reference,
  ${excelDateTime("r.request_created_at")}        AS submitted_on,
  r.submitter_name,
  r.submitter_email,
  r.employee_name,
  r.employee_department,
  r.employee_designation,
  r.travel_cost_center,
  r.travel_destination,
  ${excelDate("r.travel_departure_date")}         AS departure_date,
  ${excelDate("r.travel_return_date")}            AS return_date,
  r.travel_category,
  r.travel_mode,
  r.travel_business_justification,
  r.engineering_jobs,
  r.travel_within_budget,
  r.travel_transport_cost,
  r.travel_other_costs,
  r.travel_per_diem,
  r.travel_total_cost,
  r.travel_approval_tier,

  CASE
    WHEN r.travel_hod_approval_status      = 'declined' THEN 'Declined by HOD'
    WHEN r.travel_hr_approval_status       = 'declined' THEN 'Declined by HR'
    WHEN r.travel_director_approval_status = 'declined' THEN 'Declined by Director'
    WHEN r.travel_hod_approval_status      = 'pending'  THEN 'Pending HOD'
    WHEN r.travel_hr_approval_status       = 'pending'  THEN 'Pending HR'
    WHEN r.travel_director_approval_status = 'pending'  THEN 'Pending Director'
    ELSE 'Approved'
  END                                             AS overall_status,

  INITCAP(r.travel_hod_approval_status)           AS hod_status,
  r.travel_hod_email                              AS assigned_hod_email,
  CASE WHEN r.travel_hod_approval_status <> 'pending' THEN r.travel_hod_approver END AS hod_actioned_by,
  r.travel_hod_actioned_by_email                  AS hod_actioned_by_email,
  ${excelDateTime("r.travel_hod_approval_date")}  AS hod_action_date,
  r.travel_hod_comments                           AS hod_comments,

  INITCAP(r.travel_hr_approval_status)            AS hr_status,
  r.travel_hr_approver                            AS hr_actioned_by,
  r.travel_hr_email                               AS hr_actioned_by_email,
  ${excelDateTime("r.travel_hr_approval_date")}   AS hr_action_date,
  r.travel_hr_comments                            AS hr_comments,
  CASE WHEN r.travel_hr_approval_date IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM r.travel_hr_approval_date
                  - COALESCE(r.last_amended_at, r.request_created_at)) / 86400.0)::numeric, 1)
  END                                             AS days_to_hr_decision,

  COALESCE(INITCAP(NULLIF(r.travel_director_approval_status, 'N/A')), r.travel_director_approval_status) AS director_status,
  r.travel_director_approver                      AS director_actioned_by,
  r.travel_director_email                         AS director_actioned_by_email,
  ${excelDateTime("r.travel_director_approval_date")} AS director_action_date,
  r.travel_director_comments                      AS director_comments,

  r.travel_hr_pushback_count                      AS pushback_count,
  ps.pushback_history,

  CASE WHEN r.amendment_count > 0 THEN 'Yes' ELSE 'No' END AS amended,
  r.amendment_count,
  ${excelDateTime("r.last_amended_at")}           AS last_amended_on,
  am.latest_amended_by,
  am.latest_reason,
  COALESCE(am.original_total_cost, r.travel_total_cost)   AS original_total_cost,
  r.travel_total_cost - COALESCE(am.original_total_cost, r.travel_total_cost) AS cost_change,
  COALESCE(am.original_tier, r.travel_approval_tier)      AS original_tier,
  am.amendment_history
FROM scoped r
LEFT JOIN pushback_summary ps  ON ps.request_id = r.request_id
LEFT JOIN amendment_summary am ON am.request_id = r.request_id
ORDER BY r.request_created_at, r.request_id
`;

const COLUMNS: ReportColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "submitted_on", header: "Submitted On", kind: "datetime" },
  { key: "submitter_name", header: "Submitted By" },
  { key: "submitter_email", header: "Submitter Email" },
  { key: "employee_name", header: "Traveller" },
  { key: "employee_department", header: "Department" },
  { key: "employee_designation", header: "Designation" },
  { key: "travel_cost_center", header: "Cost Centre" },
  { key: "travel_destination", header: "Destination" },
  { key: "departure_date", header: "Departure Date", kind: "date" },
  { key: "return_date", header: "Return Date", kind: "date" },
  { key: "travel_category", header: "Travel Category" },
  { key: "travel_mode", header: "Travel Mode" },
  { key: "travel_business_justification", header: "Business Justification", kind: "longtext" },
  { key: "engineering_jobs", header: "Engineering Jobs", kind: "longtext" },
  { key: "travel_within_budget", header: "Within Budget?" },
  { key: "travel_transport_cost", header: "Transport Cost (KES)", kind: "money" },
  { key: "travel_other_costs", header: "Other Costs (KES)", kind: "money" },
  { key: "travel_per_diem", header: "Per Diem (KES)", kind: "money" },
  { key: "travel_total_cost", header: "Total Cost (KES)", kind: "money" },
  { key: "travel_approval_tier", header: "Approval Tier" },
  { key: "overall_status", header: "Overall Status" },
  { key: "hod_status", header: "HOD Status" },
  { key: "assigned_hod_email", header: "Assigned HOD Email" },
  { key: "hod_actioned_by", header: "HOD Actioned By" },
  { key: "hod_actioned_by_email", header: "HOD Actioned By Email" },
  { key: "hod_action_date", header: "HOD Action Date", kind: "datetime" },
  { key: "hod_comments", header: "HOD Comments", kind: "longtext" },
  { key: "hr_status", header: "HR Status" },
  { key: "hr_actioned_by", header: "HR Actioned By" },
  { key: "hr_actioned_by_email", header: "HR Actioned By Email" },
  { key: "hr_action_date", header: "HR Action Date", kind: "datetime" },
  { key: "hr_comments", header: "HR Comments", kind: "longtext" },
  { key: "days_to_hr_decision", header: "Days to HR Decision", kind: "decimal" },
  { key: "director_status", header: "Director Status" },
  { key: "director_actioned_by", header: "Director Actioned By" },
  { key: "director_actioned_by_email", header: "Director Actioned By Email" },
  { key: "director_action_date", header: "Director Action Date", kind: "datetime" },
  { key: "director_comments", header: "Director Comments", kind: "longtext" },
  { key: "pushback_count", header: "HR Push-backs", kind: "integer" },
  { key: "pushback_history", header: "Push-back History", kind: "longtext" },
  { key: "amended", header: "Amended?" },
  { key: "amendment_count", header: "Amendment Count", kind: "integer" },
  { key: "last_amended_on", header: "Last Amended On", kind: "datetime" },
  { key: "latest_amended_by", header: "Last Amended By" },
  { key: "latest_reason", header: "Latest Amendment Reason", kind: "longtext" },
  { key: "original_total_cost", header: "Original Total Cost (KES)", kind: "money" },
  { key: "cost_change", header: "Cost Change (KES)", kind: "money" },
  { key: "original_tier", header: "Original Tier" },
  { key: "amendment_history", header: "Full Amendment History", kind: "longtext" },
];

export async function buildTravelReport({
  from,
  to,
  status,
}: ReportQueryParams): Promise<ReportSheet[]> {
  const rows = await query(SQL, [from, to, status]);
  return [{ name: "Travel Requisitions", columns: COLUMNS, rows }];
}
