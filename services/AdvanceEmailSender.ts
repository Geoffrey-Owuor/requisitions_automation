import { cache } from "react";
import { query } from "@/lib/db";
import { sendEmail } from "./EmailService";
import { AdvanceRequisitionTemplate } from "@/utils/templates/AdvanceRequisitionTemplate";

export interface AdvanceMailTemplateValues {
  datesubmitted: string;
  staffname: string;
  staffnumber: string;
  staffemail: string;
  staffdepartment: string;
  stafflocation: string;
  requestamount: number;
  installments: string;
  repaymentstartdate: string;
  requesttype: string;
  approvalstatus: string;
  approvercomments: string;
}

export const AdvanceDataQuery = `
    SELECT request_created_at AS datesubmitted,
    staff_number AS staffnumber,
    staff_name AS staffname,
    staff_email AS staffemail,
    staff_department AS staffdepartment,
    staff_location AS stafflocation,
    request_amount AS requestamount,
    no_of_installments AS installments,
    repayment_start_date AS repaymentstartdate,
    request_type AS requesttype,
    approval_status AS approvalstatus,
    approver_comments AS approvercomments
    FROM salary_advances WHERE request_id = $1

`;

export interface AdvanceDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
}

export const getAdvanceEmailData = cache(async (requestId: string) => {
  const result = await query<AdvanceMailTemplateValues>(AdvanceDataQuery, [
    requestId,
  ]);
  return result[0];
});

export async function AdvanceEmailSender({
  to,
  requestId,
  message,
  title,
}: AdvanceDataProps) {
  const emailData = await getAdvanceEmailData(requestId);

  const emailHtml = AdvanceRequisitionTemplate({
    title,
    message,
    emailData,
  });

  await sendEmail({
    from: process.env.ACCESS_EMAIL_SENDER!,
    to,
    subject: title,
    html: emailHtml,
  });
}
