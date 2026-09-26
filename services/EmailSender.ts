import { cache } from "react";
import { query } from "@/lib/db";
import { TravelRequisitionTemplate } from "@/utils/templates/TravelRequisitionTemplate";
import { sendEmail } from "./EmailService";
import {
  TravelPushbackValues,
  travelPushbacksQuery,
} from "@/lib/travelPushback";
import {
  TravelAmendmentValues,
  travelAmendmentsQuery,
} from "@/lib/travelAmendment";

export interface EmailDataValues {
  emailaddress: string;
  employeename: string;
  department: string;
  designation: string;
  destination: string;
  departuredate: string;
  returndate: string;
  travelcategory: string;
  businessjustification: string;
  modeoftransport: string;
  twowaytransportcost: string;
  othercosts: number;
  perdiempolicy: number;
  estimatedcost: number;
  costcentre: string;
  withinbudget: string;
  approvaltier: string;
  hodapprover: string;
  hodemail: string;
  hodcomments: string;
  hrapprover: string;
  hremail: string;
  hrcomments: string;
  directorapprover: string;
  directoremail: string;
  directorcomments: string;
  hodapprovalstatus: string;
  hrapprovalstatus: string;
  directorapprovalstatus: string;
  engineeringjobs: string;
  pushbacks: TravelPushbackValues[];
  amendments: TravelAmendmentValues[];
}

export const travelDataQuery = `
     SELECT 
       submitter_email AS emailaddress, 
       employee_name AS employeename, 
       employee_department AS department, 
       employee_designation AS designation, 
       travel_destination AS destination, 
       travel_departure_date AS departuredate, 
       travel_return_date AS returndate, 
       travel_category AS travelcategory,
       travel_business_justification AS businessjustification, 
       travel_mode AS modeoftransport, 
       travel_transport_cost AS twowaytransportcost, 
       travel_other_costs AS othercosts, 
       travel_per_diem AS perdiempolicy, 
       travel_total_cost AS estimatedcost, 
       travel_cost_center AS costcentre, 
       travel_within_budget AS withinbudget,
       travel_approval_tier AS approvaltier, 
       travel_hod_approval_status AS hodapprovalstatus, 
       travel_hr_approval_status AS hrapprovalstatus,
       travel_director_approval_status AS directorapprovalstatus, 
       travel_hod_approver AS hodapprover,
       travel_hod_email AS hodemail,
       travel_hod_comments AS hodcomments,
       travel_hr_approver AS hrapprover,
       travel_hr_email AS hremail,
       travel_hr_comments AS hrcomments,
       travel_director_approver AS directorapprover,
       travel_director_email AS directoremail,
       travel_director_comments AS directorcomments,
       engineering_jobs AS engineeringjobs
       FROM travel_requisitions WHERE request_id = $1
`;

export interface EmailDataProps {
  to: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
  showPdfDownload?: boolean;
}

// Requisition row plus its HR push-back and amendment history, or undefined
// if not found. Shared by the emails and the PDF page.
export async function getTravelRequisitionData(
  requestId: string,
): Promise<EmailDataValues | undefined> {
  const [result, pushbacks, amendments] = await Promise.all([
    query<Omit<EmailDataValues, "pushbacks" | "amendments">>(travelDataQuery, [
      requestId,
    ]),
    query<TravelPushbackValues>(travelPushbacksQuery, [requestId]),
    query<TravelAmendmentValues>(travelAmendmentsQuery, [requestId]),
  ]);
  if (result.length === 0) return undefined;
  return { ...result[0], pushbacks, amendments };
}

// Cached query — repeated calls with the same requestId hit the DB only once
export const getTravelEmailData = cache(async (requestId: string) => {
  return (await getTravelRequisitionData(requestId))!;
});

export async function EmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
  showPdfDownload = false,
}: EmailDataProps) {
  const emailData = await getTravelEmailData(requestId);

  const emailHtml = TravelRequisitionTemplate({
    requestId,
    message,
    title,
    role,
    emailData,
    reviewLink,
    showPdfDownload,
  });

  await sendEmail({
    from: process.env.EMAIL_SENDER!,
    to: to,
    subject: title,
    html: emailHtml,
  });
}
