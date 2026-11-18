import "server-only";
import { alterationsJsonLateral } from "@/lib/salaryAdvanceRules";

// What a salary advance table row (and the advance modal) needs, as `sa`
// with its alterations as `alt`. Shared by the HR dashboard's table
// (serverActions/GetSalaryAdvanceData.ts) and the analytics Records view
// (lib/analytics/records/advance.ts). Not in the "use server" file, which
// may only export async functions.

export const ADVANCE_TABLE_COLUMNS = `sa.request_id, sa.request_created_at, sa.staff_number, sa.staff_name, sa.staff_email, sa.staff_department,
    sa.staff_location, sa.staff_phone_number, sa.request_amount, sa.no_of_installments, sa.repayment_start_date,
    sa.request_type, sa.approval_status, sa.approver_comments, sa.exported,
    (alt.alterations IS NOT NULL) AS altered,
    COALESCE(alt.alterations, '[]'::json) AS alterations`;

export const ADVANCE_TABLE_FROM = `salary_advances sa
    ${alterationsJsonLateral("sa")}`;

// Matched against when a search term is supplied — mirrors what the table
// shows (employee, department, type, status)
export const ADVANCE_SEARCHABLE_COLUMNS = [
  "sa.staff_name",
  "sa.staff_number",
  "sa.staff_department",
  "sa.request_type",
  "sa.approval_status",
  "sa.staff_phone_number",
];
