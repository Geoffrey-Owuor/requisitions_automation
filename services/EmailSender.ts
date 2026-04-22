import { query } from "@/lib/db";
import { TravelRequisitionTemplate } from "@/utils/templates/TravelRequisitionTemplate";
import { sendEmail } from "./EmailService";

export interface EmailDataValues {
  emailAddress: string;
  employeeName: string;
  department: string;
  designation: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelCategory: string;
  businessJustification: string;
  modeOfTransport: string;
  twoWayTransportCost: string;
  otherCosts: number;
  perDiemPolicy: number;
  estimatedCost: number;
  costCentre: string;
  withinBudget: string;
  approvalTier: string;
  hodApprover: string;
  hodEmail: string;
  hodComments: string;
  hrApprover: string;
  hrEmail: string;
  hrComments: string;
  directorApprover: string;
  directorEmail: string;
  directorComments: string;
  hodApprovalStatus: string;
  hrApprovalStatus: string;
  directorApprovalStatus: string;
}

export interface EmailDataProps {
  to?: string | string[];
  requestId: string;
  message: string;
  title: string;
  role: string;
  reviewLink?: string;
  showPdfDownload?: boolean;
}

export async function EmailSender({
  to,
  requestId,
  message,
  title,
  role,
  reviewLink,
  showPdfDownload = false,
}: EmailDataProps) {
  // Our base query
  const baseQuery = `
     SELECT 
       submitter_email AS emailAddress, 
       employee_name AS employeeName, 
       employee_department AS department, 
       employee_designation AS designation, 
       travel_destination AS destination, 
       travel_departure_date AS departureDate, 
       travel_return_date AS returnDate, 
       travel_category AS travelCategory,
       travel_business_justification AS businessJustification, 
       travel_mode AS modeOfTransport, 
       travel_transport_cost AS twoWayTransportCost, 
       travel_other_costs AS otherCosts, 
       travel_per_diem AS perDiemPolicy, 
       travel_total_cost AS estimatedCost, 
       travel_cost_center AS costCentre, 
       travel_within_budget AS withinBudget,
       travel_approval_tier AS approvalTier, 
       travel_hod_approval_status AS hodApprovalStatus, 
       travel_hr_approval_status AS hrApprovalStatus,
       travel_director_approval_status AS directorApprovalStatus, 
       travel_hod_approver AS hodApprover,
       travel_hod_email AS hodEmail,
       travel_hod_comments AS hodComments,
       travel_hr_approver AS hrApprover,
       travel_hr_email AS hrEmail,
       travel_hr_comments AS hrComments,
       travel_director_approver AS directorApprover,
       travel_director_email AS directorEmail,
       travel_director_comments AS directorComments
       FROM travel_requisitions WHERE request_id = $1
     `;
  // Query the required email template values
  const emailDataResult = await query<EmailDataValues>(baseQuery, [requestId]);
  const emailData = emailDataResult[0];

  //Generate the email html
  const emailHtml = TravelRequisitionTemplate({
    requestId,
    message,
    title,
    role,
    emailData,
    reviewLink,
    showPdfDownload,
  });

  // Sending the email
  await sendEmail({ to: to, subject: title, html: emailHtml });
}
