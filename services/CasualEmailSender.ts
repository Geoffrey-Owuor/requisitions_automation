import { cache } from "react";
import { query } from "@/lib/db";
import { CasualRequisitionTemplate } from "@/utils/templates/CasualRequisitionTemplate";
import { sendEmail } from "./EmailService";

export interface CasualSectionValues {
  sectionname: string;
  justification: string;
  numberofcasuals: number;
  ppesrequired: string;
  periodfrom: string;
  periodto: string;
  engagementdays: number;
  rateperday: number;
  totalamount: number;
}

export interface CasualAmendmentSectionValues {
  sectionName: string;
  changeType: "added" | "removed" | "modified";
  previousNumberOfCasuals: number | null;
  newNumberOfCasuals: number | null;
  previousJustification: string | null;
  newJustification: string | null;
  previousPpesRequired: string | null;
  newPpesRequired: string | null;
  previousPeriodFrom: string | null;
  newPeriodFrom: string | null;
  previousPeriodTo: string | null;
  newPeriodTo: string | null;
  previousEngagementDays: number | null;
  newEngagementDays: number | null;
  previousRatePerDay: number | null;
  newRatePerDay: number | null;
  previousTotalAmount: number | null;
  newTotalAmount: number | null;
}

export interface CasualAmendmentValues {
  amendmentid: string;
  amendmentnumber: number;
  amendedbyname: string;
  amendedbyemail: string;
  amendmentreason: string;
  createdat: string;
  previousdepartment: string | null;
  newdepartment: string | null;
  previouslocation: string | null;
  newlocation: string | null;
  previouscasualcategory: string | null;
  newcasualcategory: string | null;
  previoushodapprover: string | null;
  newhodapprover: string | null;
  previoustotalcasuals: number | null;
  newtotalcasuals: number | null;
  previoustotalamount: number | null;
  newtotalamount: number | null;
  sections: CasualAmendmentSectionValues[];
}

export interface CasualEmailDataValues {
  emailaddress: string;
  submittername: string;
  department: string;
  location: string;
  hodapprovalstatus: string;
  hrapprovalstatus: string;
  hodapprover: string;
  hodemail: string;
  hodcomments: string;
  hrapprover: string;
  hremail: string;
  hrcomments: string;
  amendmentcount: number;
  lastamendedat: string | null;
  sections: CasualSectionValues[];
  amendments: CasualAmendmentValues[];
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
       casual_hr_approval_status AS hrapprovalstatus,
       casual_hod_approver AS hodapprover,
       casual_hod_email AS hodemail,
       casual_hod_comments AS hodcomments,
       casual_hr_approver AS hrapprover,
       casual_hr_email AS hremail,
       casual_hr_comments AS hrcomments,
       amendment_count AS amendmentcount,
       last_amended_at AS lastamendedat
       FROM casual_requisitions WHERE request_id = $1
`;

export const casualSectionsQuery = `
     SELECT
       section_name AS sectionname,
       casual_justification AS justification,
       number_of_casuals AS numberofcasuals,
       ppes_required AS ppesrequired,
       engagement_period_from AS periodfrom,
       engagement_period_to AS periodto,
       engagement_days AS engagementdays,
       casual_rate_per_day AS rateperday,
       casual_total_amount AS totalamount
       FROM casual_requisition_sections WHERE request_id = $1 ORDER BY section_name
`;

export const casualAmendmentsQuery = `
     SELECT
       a.amendment_id AS amendmentid,
       a.amendment_number AS amendmentnumber,
       a.amended_by_name AS amendedbyname,
       a.amended_by_email AS amendedbyemail,
       a.amendment_reason AS amendmentreason,
       a.created_at AS createdat,
       a.previous_department AS previousdepartment,
       a.new_department AS newdepartment,
       a.previous_location AS previouslocation,
       a.new_location AS newlocation,
       a.previous_casual_category AS previouscasualcategory,
       a.new_casual_category AS newcasualcategory,
       a.previous_hod_approver AS previoushodapprover,
       a.new_hod_approver AS newhodapprover,
       a.previous_total_casuals AS previoustotalcasuals,
       a.new_total_casuals AS newtotalcasuals,
       a.previous_total_amount AS previoustotalamount,
       a.new_total_amount AS newtotalamount,
       COALESCE(
         (SELECT json_agg(json_build_object(
             'sectionName', s.section_name,
             'changeType', s.change_type,
             'previousNumberOfCasuals', s.previous_number_of_casuals,
             'newNumberOfCasuals', s.new_number_of_casuals,
             'previousJustification', s.previous_justification,
             'newJustification', s.new_justification,
             'previousPpesRequired', s.previous_ppes_required,
             'newPpesRequired', s.new_ppes_required,
             'previousPeriodFrom', s.previous_period_from,
             'newPeriodFrom', s.new_period_from,
             'previousPeriodTo', s.previous_period_to,
             'newPeriodTo', s.new_period_to,
             'previousEngagementDays', s.previous_engagement_days,
             'newEngagementDays', s.new_engagement_days,
             'previousRatePerDay', s.previous_rate_per_day,
             'newRatePerDay', s.new_rate_per_day,
             'previousTotalAmount', s.previous_total_amount,
             'newTotalAmount', s.new_total_amount
           ) ORDER BY s.section_name)
          FROM casual_requisition_amendment_sections s WHERE s.amendment_id = a.amendment_id),
         '[]'
       ) AS sections
       FROM casual_requisition_amendments a
       WHERE a.request_id = $1
       ORDER BY a.amendment_number ASC
`;

export interface CasualEmailDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
  showPdfDownload?: boolean;
  attachments?: { filename: string; content: Buffer }[];
  isExternal?: boolean;
}

// Cached query — repeated calls with the same requestId hit the DB only once
export const getCasualEmailData = cache(async (requestId: string) => {
  const [headerResult, sections, amendments] = await Promise.all([
    query<
      Omit<
        CasualEmailDataValues,
        "sections" | "amendments" | "totalamount" | "totalcasuals"
      >
    >(casualDataQuery, [requestId]),
    query<CasualSectionValues>(casualSectionsQuery, [requestId]),
    query<CasualAmendmentValues>(casualAmendmentsQuery, [requestId]),
  ]);

  const totalamount = sections.reduce((sum, s) => sum + s.totalamount, 0);
  const totalcasuals = sections.reduce(
    (sum, s) => sum + s.numberofcasuals,
    0,
  );

  return {
    ...headerResult[0],
    sections,
    amendments,
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
  attachments,
  isExternal = false,
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
    isExternal,
  });

  await sendEmail({
    from: process.env.CASUAL_EMAIL_SENDER!,
    to: to,
    subject: title,
    html: emailHtml,
    attachments,
  });
}
