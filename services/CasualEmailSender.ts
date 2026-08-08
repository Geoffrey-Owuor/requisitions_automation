import { cache } from "react";
import { query } from "@/lib/db";
import { CasualRequisitionTemplate } from "@/utils/templates/CasualRequisitionTemplate";
import { sendEmail } from "./EmailService";

export interface CasualSectionValues {
  sectionname: string;
  justification: string;
  numberofcasuals: number;
  hrapprovedcasuals: number | null;
  ppesrequired: string;
  periodfrom: string;
  periodto: string;
  engagementdays: number;
  rateperday: number;
  totalamount: number;
}

export interface CasualEmailDataValues {
  emailaddress: string;
  submittername: string;
  department: string;
  location: string;
  hodapprovalstatus: string;
  financeapprovalstatus: string;
  hrapprovalstatus: string;
  hodapprover: string;
  hodemail: string;
  hodcomments: string;
  financeapprover: string;
  financeemail: string;
  financecomments: string;
  hrapprover: string;
  hremail: string;
  hrcomments: string;
  sections: CasualSectionValues[];
  totalamount: number;
  totalcasuals: number;
}

export const casualDataQuery = `
     SELECT
       submitter_email AS emailaddress,
       submitter_name AS submittername,
       employee_department AS department,
       casual_location AS location,
       casual_hod_approval_status AS hodapprovalstatus,
       casual_finance_approval_status AS financeapprovalstatus,
       casual_hr_approval_status AS hrapprovalstatus,
       casual_hod_approver AS hodapprover,
       casual_hod_email AS hodemail,
       casual_hod_comments AS hodcomments,
       casual_finance_approver AS financeapprover,
       casual_finance_email AS financeemail,
       casual_finance_comments AS financecomments,
       casual_hr_approver AS hrapprover,
       casual_hr_email AS hremail,
       casual_hr_comments AS hrcomments
       FROM casual_requisitions WHERE request_id = $1
`;

export const casualSectionsQuery = `
     SELECT
       section_name AS sectionname,
       casual_justification AS justification,
       number_of_casuals AS numberofcasuals,
       hr_approved_casuals AS hrapprovedcasuals,
       ppes_required AS ppesrequired,
       engagement_period_from AS periodfrom,
       engagement_period_to AS periodto,
       engagement_days AS engagementdays,
       casual_rate_per_day AS rateperday,
       casual_total_amount AS totalamount
       FROM casual_requisition_sections WHERE request_id = $1 ORDER BY section_name
`;

export interface CasualEmailDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
  showPdfDownload?: boolean;
}

// Cached query — repeated calls with the same requestId hit the DB only once
export const getCasualEmailData = cache(async (requestId: string) => {
  const [headerResult, sections] = await Promise.all([
    query<
      Omit<CasualEmailDataValues, "sections" | "totalamount" | "totalcasuals">
    >(casualDataQuery, [requestId]),
    query<CasualSectionValues>(casualSectionsQuery, [requestId]),
  ]);

  const totalamount = sections.reduce((sum, s) => sum + s.totalamount, 0);

  // Get the HR Approved casuals
  const totalHrApprovedCasuals = sections.reduce(
    (sum, s) => sum + (s.hrapprovedcasuals ?? 0),
    0,
  );

  // Get the initial number of casuals
  const totalInitialCasuals = sections.reduce(
    (sum, s) => sum + s.numberofcasuals,
    0,
  );
  const totalcasuals =
    totalHrApprovedCasuals === totalInitialCasuals ||
    totalHrApprovedCasuals === 0
      ? totalInitialCasuals
      : totalHrApprovedCasuals;

  return {
    ...headerResult[0],
    sections,
    totalamount,
    totalcasuals,
  } as CasualEmailDataValues;
});

export async function CasualEmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
  showPdfDownload = false,
}: CasualEmailDataProps) {
  const emailData = await getCasualEmailData(requestId);

  const emailHtml = CasualRequisitionTemplate({
    requestId,
    message,
    title,
    role,
    emailData,
    reviewLink,
    showPdfDownload,
  });

  await sendEmail({
    from: process.env.CASUAL_EMAIL_SENDER!,
    to: to,
    subject: title,
    html: emailHtml,
  });
}
