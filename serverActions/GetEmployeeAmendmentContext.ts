"use server";

import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sameEmail } from "@/lib/hodAssignment";
import {
  EmployeeAttachmentType,
  isEmployeeAmendableHrStatus,
  parseSalaryRange,
} from "@/public/assets";
import {
  employeeAmendmentsQuery,
  EmployeeAmendmentValues,
} from "@/lib/employeeAmendment";
import { EmployeeFormData } from "@/components/Modules/Retail/EmployeeRequisitionForm";

export interface EmployeeAmendmentContext {
  requestId: string;
  expectedAmendmentCount: number;
  initialData: EmployeeFormData;
  history: EmployeeAmendmentValues[];
}

// Amendments are only allowed for the original submitter, before HR approves
// - a decline at any stage is still amendable. Returns null when the
// requisition doesn't exist, isn't owned by the current user, or is no
// longer within that window. The amendment route re-checks everything.
export async function getEmployeeAmendmentContext(
  requestId: string,
): Promise<EmployeeAmendmentContext | null> {
  const session = await getSession();
  if (!session) return null;

  const headerResult = await query<{
    submitter_email: string;
    employee_hr_approval_status: string;
    amendment_count: number;
    employee_department: string;
    employee_hod_email: string;
  }>(
    `SELECT submitter_email, employee_hr_approval_status, amendment_count,
     employee_department, employee_hod_email
     FROM employee_requisitions WHERE request_id = $1`,
    [requestId],
  );

  if (headerResult.length === 0) return null;

  const header = headerResult[0];

  const isAmendable =
    sameEmail(header.submitter_email, session.email) &&
    isEmployeeAmendableHrStatus(header.employee_hr_approval_status);

  if (!isAmendable) return null;

  const [positions, attachments, history] = await Promise.all([
    query<{
      position_id: string;
      position_title: string;
      number_required: number;
      position_replacement_or_new: string;
      position_job_grade: string;
      position_salary_range: string;
      position_justification: string;
      position_reporting_to: string;
      date_filled: string;
    }>(
      `SELECT position_id, position_title, number_required,
       position_replacement_or_new, position_job_grade, position_salary_range,
       position_justification, position_reporting_to,
       TO_CHAR(date_position_filled, 'YYYY-MM-DD') AS date_filled
       FROM employee_requisition_positions WHERE request_id = $1
       ORDER BY position_created_at, position_id`,
      [requestId],
    ),
    query<{
      attachment_id: string;
      position_id: string;
      attachment_type: EmployeeAttachmentType;
      original_filename: string;
    }>(
      `SELECT attachment_id, position_id, attachment_type, original_filename
       FROM employee_requisition_attachments WHERE request_id = $1`,
      [requestId],
    ),
    query<EmployeeAmendmentValues>(employeeAmendmentsQuery, [requestId]),
  ]);

  const initialData: EmployeeFormData = {
    department: header.employee_department,
    // The form holds the assigned HOD's email (see hodNameLabel)
    hodApprover: header.employee_hod_email,
    positions: positions.map((position) => {
      // An unparseable legacy salary range is left blank to be re-entered
      const salary = parseSalaryRange(position.position_salary_range);

      return {
        clientId: randomUUID(),
        positionId: position.position_id,
        title: position.position_title,
        numberRequired: position.number_required,
        replacementOrNew: position.position_replacement_or_new,
        jobGrade: position.position_job_grade,
        salaryMin: salary?.min ?? 0,
        salaryMax: salary?.max ?? 0,
        justification: position.position_justification,
        reportingTo: position.position_reporting_to,
        dateFilled: position.date_filled,
        files: {},
        existingFiles: Object.fromEntries(
          attachments
            .filter(
              (attachment) => attachment.position_id === position.position_id,
            )
            .map((attachment) => [
              attachment.attachment_type,
              {
                attachmentId: attachment.attachment_id,
                originalFilename: attachment.original_filename,
              },
            ]),
        ),
      };
    }),
  };

  return {
    requestId,
    expectedAmendmentCount: header.amendment_count,
    initialData,
    history,
  };
}
