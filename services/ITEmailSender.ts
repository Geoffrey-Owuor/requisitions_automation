import { cache } from "react";
import { query } from "@/lib/db";
import { sendEmail } from "./EmailService";
import { ITRequisitionTemplate } from "@/utils/templates/ITRequisitionTemplate";

export interface ITMailTemplateValues {
  datesubmitted: string;
  submittername: string;
  employeename: string;
  employeestaffnumber: string;
  employeedepartment: string;
  replacementnew: string;
  requirements: string;
  otherrequirements: string;
  requisitiondate: string;
  datejoining: string;
  hodapprover: string;
  hodapprovalstatus: string;
  hodcomments: string;
  itapprover: string;
  itapprovalstatus: string;
  itcomments: string;
}

export const ITDataQuery = `
  SELECT
  request_created_at AS datesubmitted,
  submitter_name AS submittername,
  employee_name AS employeename,
  employee_staff_number AS employeestaffnumber,
  employee_department AS employeedepartment,
  replacement_new AS replacementnew,
  requirements,
  other_requirements AS otherrequirements,
  requisition_date AS requisitiondate,
  date_joining AS datejoining,
  hod_approver_name AS hodapprover,
  hod_approver_status AS hodapprovalstatus,
  hod_approver_comments AS hodcomments,
  it_approver_name AS itapprover,
  it_approver_status AS itapprovalstatus,
  it_approver_comments AS itcomments
  FROM it_requisitions WHERE request_id = $1
`;

export interface ITDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
}

export const getITEmailData = cache(async (requestId: string) => {
  const result = await query<ITMailTemplateValues>(ITDataQuery, [requestId]);
  return result[0];
});

export async function ITEmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
}: ITDataProps) {
  const emailData = await getITEmailData(requestId);

  const emailHtml = ITRequisitionTemplate({
    requestId,
    title,
    message,
    role,
    emailData,
    reviewLink,
  });

  await sendEmail({
    from: process.env.IT_EMAIL_SENDER!,
    to,
    subject: title,
    html: emailHtml,
  });
}
