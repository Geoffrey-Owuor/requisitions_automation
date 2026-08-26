import { cache } from "react";
import { query } from "@/lib/db";
import { EmployeeRequisitionTemplate } from "@/utils/templates/EmployeeRequisitionTemplate";
import { sendEmail } from "./EmailService";

export interface EmployeeAttachmentValues {
  attachmentid: string;
  positionid: string;
  originalfilename: string;
}

export interface EmployeePositionValues {
  positionid: string;
  positiontitle: string;
  numberrequired: number;
  replacementornew: string;
  jobgrade: string;
  salaryrange: string;
  justification: string;
  reportingto: string;
  datefilled: string;
  attachments: EmployeeAttachmentValues[];
}

export interface EmployeeEmailDataValues {
  emailaddress: string;
  submittername: string;
  department: string;
  hodapprovalstatus: string;
  directorapprovalstatus: string;
  hrapprovalstatus: string;
  hodapprover: string;
  hodemail: string;
  hodcomments: string;
  directorapprover: string;
  directoremail: string;
  directorcomments: string;
  hrapprover: string;
  hremail: string;
  hrcomments: string;
  positions: EmployeePositionValues[];
  totalpositions: number;
  totalnumberrequired: number;
}

export const employeeDataQuery = `
     SELECT
       submitter_email AS emailaddress,
       submitter_name AS submittername,
       employee_department AS department,
       employee_hod_approval_status AS hodapprovalstatus,
       employee_director_approval_status AS directorapprovalstatus,
       employee_hr_approval_status AS hrapprovalstatus,
       employee_hod_approver AS hodapprover,
       employee_hod_email AS hodemail,
       employee_hod_comments AS hodcomments,
       employee_director_approver AS directorapprover,
       employee_director_email AS directoremail,
       employee_director_comments AS directorcomments,
       employee_hr_approver AS hrapprover,
       employee_hr_email AS hremail,
       employee_hr_comments AS hrcomments
       FROM employee_requisitions WHERE request_id = $1
`;

export const employeePositionsQuery = `
     SELECT
       position_id AS positionid,
       position_title AS positiontitle,
       number_required AS numberrequired,
       position_replacement_or_new AS replacementornew,
       position_job_grade AS jobgrade,
       position_salary_range AS salaryrange,
       position_justification AS justification,
       position_reporting_to AS reportingto,
       date_position_filled AS datefilled
       FROM employee_requisition_positions WHERE request_id = $1 ORDER BY position_created_at
`;

export const employeeAttachmentsQuery = `
     SELECT
       attachment_id AS attachmentid,
       position_id AS positionid,
       original_filename AS originalfilename
       FROM employee_requisition_attachments WHERE request_id = $1 ORDER BY position_id, upload_index
`;

export interface EmployeeEmailDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
  showViewLink?: boolean;
}

type EmployeeHeaderRow = Omit<
  EmployeeEmailDataValues,
  "positions" | "totalpositions" | "totalnumberrequired"
>;

// Cached query — repeated calls with the same requestId hit the DB only once
export const getEmployeeEmailData = cache(async (requestId: string) => {
  const [headerResult, positions, attachments] = await Promise.all([
    query<EmployeeHeaderRow>(employeeDataQuery, [requestId]),
    query<Omit<EmployeePositionValues, "attachments">>(
      employeePositionsQuery,
      [requestId],
    ),
    query<EmployeeAttachmentValues>(employeeAttachmentsQuery, [requestId]),
  ]);

  const positionsWithAttachments: EmployeePositionValues[] = positions.map(
    (position) => ({
      ...position,
      attachments: attachments.filter(
        (attachment) => attachment.positionid === position.positionid,
      ),
    }),
  );

  const totalpositions = positionsWithAttachments.length;
  const totalnumberrequired = positionsWithAttachments.reduce(
    (sum, p) => sum + Number(p.numberrequired),
    0,
  );

  return {
    ...headerResult[0],
    positions: positionsWithAttachments,
    totalpositions,
    totalnumberrequired,
  } as EmployeeEmailDataValues;
});

export async function EmployeeEmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
  showViewLink = false,
}: EmployeeEmailDataProps) {
  const emailData = await getEmployeeEmailData(requestId);

  const emailHtml = EmployeeRequisitionTemplate({
    requestId,
    message,
    title,
    role,
    emailData,
    reviewLink,
    showViewLink,
  });

  await sendEmail({
    from: process.env.EMPLOYEE_EMAIL_SENDER!,
    to: to,
    subject: title,
    html: emailHtml,
  });
}
