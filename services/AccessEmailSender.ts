import { cache } from "react";
import { query } from "@/lib/db";
import { sendEmail } from "./EmailService";
import { AccessRequisitionTemplate } from "@/utils/templates/AccessRequisitionTemplate";

export interface AccessMailTemplateValues {
  datesubmitted: string;
  submittername: string;
  employeename: string;
  employeestaffnumber: string;
  employeedepartment: string;
  issuancedate: string;
  requirements: string;
  locations: string;
  hodapprover: string;
  hodapprovalstatus: string;
  hodcomments: string;
  securityapprover: string;
  securityapprovalstatus: string;
  securitycomments: string;
}

const TravelDataQuery = `
   SELECT request_created_at AS datesubmitted,
   submitter_name AS submittername,
   employee_name AS employeename,
   employee_staff_number AS employeestaffnumber,
   employee_department AS employeedepartment,
   issuance_date AS issuancedate,
   access_requirements AS requirements,
   access_locations AS locations,
   hod_approver_name AS hodapprover,
   hod_approver_status AS hodapprovalstatus,
   hod_approver_comments AS hodcomments,
   security_approver_name AS securityapprover,
   security_approver_status AS securityapprovalstatus,
   security_approver_comments AS securitycomments
   FROM access_requisitions WHERE request_id = $1
`;

export interface AccessDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
}

export const getAccessEmailData = cache(async (requestId: string) => {
  const result = await query<AccessMailTemplateValues>(TravelDataQuery, [
    requestId,
  ]);
  return result[0];
});

export async function AccessEmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
}: AccessDataProps) {
  const emailData = await getAccessEmailData(requestId);

  const emailHtml = AccessRequisitionTemplate({
    requestId,
    title,
    message,
    role,
    emailData,
    reviewLink,
  });

  await sendEmail({
    from: process.env.ACCESS_EMAIL_SENDER!,
    to,
    subject: title,
    html: emailHtml,
  });
}
