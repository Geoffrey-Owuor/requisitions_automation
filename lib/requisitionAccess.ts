import "server-only";
import { query } from "@/lib/db";
import { isUuid } from "@/lib/uuid";
import { isHodViewer, sameEmail } from "@/lib/hodAssignment";
import { employeeStageReachedSql } from "@/lib/employeeApprovalOrder";
import { canViewAnalyticsType } from "@/lib/analytics/definitions";
import { getUserRoles } from "@/serverActions/GetUserRoles";

// Who may open one requisition's details outside its approval link: the
// PDF pages, the employeeview page, the dashboard modals' detail and audit
// reads, and Employee attachments. The single place these rules live:
//
// - its submitter
// - its HOD: the assigned HOD, whoever acted on the HOD stage, or (while
//   that stage is pending) an alternate of the assigned HOD (isHodViewer)
// - a member of a later stage's array once the requisition has reached
//   that stage, exactly as their approval history shows it (the
//   `history` scopes in serverActions/Get{Type}RequisitionData.ts)
// - Travel's Finance mailbox (FIRST_FINANCE_EMAIL), which is emailed the
//   PDF link on final approval and on push-backs
// - holders of the type's analytics role, whose Records view lists every
//   requisition of the type
//
// Approval links are separate: the approval pages and the attachment
// route's token branch authorize by token, without a session.

export type ViewableRequisitionType =
  | "travel"
  | "it"
  | "access"
  | "casual"
  | "employee";

type AccessRule = {
  table: string;
  submitterColumn: string;
  hodEmailColumn: string;
  hodActionedByColumn: string;
  hodStatusColumn: string;
  // Conditions on row `r`, with $2 the viewer's email
  stageScopes: string[];
};

const member = (array: string, extra = "") =>
  `EXISTS (SELECT 1 FROM ${array}_array WHERE ${array}_email = $2${extra})`;
const hrFor = (form: string) => member("hr", ` AND '${form}' = ANY(hr_forms)`);

const RULES: Record<ViewableRequisitionType, AccessRule> = {
  travel: {
    table: "travel_requisitions",
    submitterColumn: "submitter_email",
    hodEmailColumn: "travel_hod_email",
    hodActionedByColumn: "travel_hod_actioned_by_email",
    hodStatusColumn: "travel_hod_approval_status",
    stageScopes: [
      `${hrFor("travel")} AND r.travel_hod_approval_status = 'approved'`,
      // Tier 3 only, once HR has approved
      `${member("director")} AND r.travel_hod_approval_status = 'approved'
        AND r.travel_hr_approval_status = 'approved'
        AND r.travel_director_approval_status <> 'N/A'`,
      `$3 <> '' AND $2 = $3`,
    ],
  },
  it: {
    table: "it_requisitions",
    submitterColumn: "submitter_email",
    hodEmailColumn: "hod_approver_email",
    hodActionedByColumn: "hod_actioned_by_email",
    hodStatusColumn: "hod_approver_status",
    stageScopes: [`${member("it")} AND r.hod_approver_status = 'approved'`],
  },
  access: {
    table: "access_requisitions",
    submitterColumn: "submitter_email",
    hodEmailColumn: "hod_approver_email",
    hodActionedByColumn: "hod_actioned_by_email",
    hodStatusColumn: "hod_approver_status",
    stageScopes: [
      `${member("security")} AND r.hod_approver_status = 'approved'`,
    ],
  },
  casual: {
    table: "casual_requisitions",
    submitterColumn: "submitter_email",
    hodEmailColumn: "casual_hod_email",
    hodActionedByColumn: "casual_hod_actioned_by_email",
    hodStatusColumn: "casual_hod_approval_status",
    stageScopes: [
      `${hrFor("casual")} AND r.casual_hod_approval_status = 'approved'`,
    ],
  },
  employee: {
    table: "employee_requisitions",
    submitterColumn: "submitter_email",
    hodEmailColumn: "employee_hod_email",
    hodActionedByColumn: "employee_hod_actioned_by_email",
    hodStatusColumn: "employee_hod_approval_status",
    stageScopes: [
      // Retail Director only applies to retail requests ('N/A' otherwise)
      `${member("retail_director")} AND ${employeeStageReachedSql("r", "retail_director")}
        AND r.employee_retail_director_approval_status <> 'N/A'`,
      `${member("director")} AND ${employeeStageReachedSql("r", "director")}`,
      `${hrFor("employee")} AND ${employeeStageReachedSql("r", "hr")}`,
    ],
  },
};

// Access has no analytics dashboard
const ANALYTICS_TYPE = {
  travel: "travel",
  it: "it",
  casual: "casual",
  employee: "employee",
} as const;

export async function canViewRequisition(
  type: ViewableRequisitionType,
  requestId: string,
  email: string,
): Promise<boolean> {
  // request_id is a uuid column: Postgres throws on malformed input
  if (!isUuid(requestId)) return false;
  const rule = RULES[type];

  const rows = await query<{
    submitter_email: string;
    hod_email: string | null;
    hod_actioned_by_email: string | null;
    hod_status: string;
    stage_access: boolean;
  }>(
    `SELECT r.${rule.submitterColumn} AS submitter_email,
       r.${rule.hodEmailColumn} AS hod_email,
       r.${rule.hodActionedByColumn} AS hod_actioned_by_email,
       r.${rule.hodStatusColumn} AS hod_status,
       (${rule.stageScopes.map((scope) => `(${scope})`).join(" OR ")}) AS stage_access
     FROM ${rule.table} r
     WHERE r.request_id = $1`,
    type === "travel"
      ? [
          requestId,
          email,
          (process.env.FIRST_FINANCE_EMAIL ?? "").trim().toLowerCase(),
        ]
      : [requestId, email],
  );
  if (rows.length === 0) return false;
  const row = rows[0];

  if (sameEmail(email, row.submitter_email) || row.stage_access) return true;
  if (
    await isHodViewer(email, {
      assignedHodEmail: row.hod_email,
      actionedByEmail: row.hod_actioned_by_email,
      hodStatus: row.hod_status,
    })
  ) {
    return true;
  }

  if (type === "access") return false;
  return canViewAnalyticsType(await getUserRoles(email), ANALYTICS_TYPE[type]);
}
