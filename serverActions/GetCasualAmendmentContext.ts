"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CasualCategory } from "@/public/assets";
import { CasualFormData } from "@/components/Modules/Retail/CasualRequisitionForm";
import {
  casualAmendmentsQuery,
  CasualAmendmentValues,
} from "@/services/CasualEmailSender";

export interface CasualAmendmentContext {
  requestId: string;
  expectedAmendmentCount: number;
  initialData: CasualFormData;
  history: CasualAmendmentValues[];
}

// Amendments are only allowed for the original submitter, before HR gives
// final approval - a HOD decline is still amendable. Returns null when the
// requisition doesn't exist, isn't owned by the current user, or is no
// longer within that window (mirrors GetCasualRequisitionDetails.ts).
export async function getCasualAmendmentContext(
  requestId: string,
): Promise<CasualAmendmentContext | null> {
  const session = await getSession();
  if (!session) return null;

  const headerResult = await query<{
    submitter_email: string;
    casual_hr_approval_status: string;
    amendment_count: number;
    employee_department: string;
    casual_location: string;
    casual_category: CasualCategory | null;
    casual_hod_approver: string;
  }>(
    `SELECT submitter_email, casual_hr_approval_status, amendment_count,
     employee_department, casual_location, casual_category, casual_hod_approver
     FROM casual_requisitions WHERE request_id = $1`,
    [requestId],
  );

  if (headerResult.length === 0) return null;

  const header = headerResult[0];

  const isAmendable =
    header.submitter_email === session.email &&
    header.casual_hr_approval_status === "pending";

  if (!isAmendable) return null;

  const [sections, history] = await Promise.all([
    query<{
      section_name: string;
      casual_justification: string;
      number_of_casuals: number;
      ppes_required: string;
      period_from: string;
      period_to: string;
    }>(
      `SELECT
        section_name,
        casual_justification,
        number_of_casuals,
        ppes_required,
        TO_CHAR(engagement_period_from, 'YYYY-MM-DD') AS period_from,
        TO_CHAR(engagement_period_to, 'YYYY-MM-DD') AS period_to
       FROM casual_requisition_sections WHERE request_id = $1 ORDER BY section_name`,
      [requestId],
    ),
    query<CasualAmendmentValues>(casualAmendmentsQuery, [requestId]),
  ]);

  const initialData: CasualFormData = {
    department: header.employee_department,
    hodApprover: header.casual_hod_approver,
    location: header.casual_location,
    casualCategory: header.casual_category ?? undefined,
    sections: sections.map((section) => ({
      sectionName: section.section_name,
      justification: section.casual_justification,
      numberOfCasuals: section.number_of_casuals,
      ppesRequired: section.ppes_required,
      periodFrom: section.period_from,
      periodTo: section.period_to,
    })),
  };

  return {
    requestId,
    expectedAmendmentCount: header.amendment_count,
    initialData,
    history,
  };
}
