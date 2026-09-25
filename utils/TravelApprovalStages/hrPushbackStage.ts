import { EmailSender } from "@/services/EmailSender";
import { escapeHtml } from "@/utils/escapeHtml";

type HrPushbackStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  previousStatus: string;
  status: string;
  reason: string;
  approverEmail: string;
  approverName: string;
};

// Push-backs only apply to Tier 1/2 requisitions, where HR is the final
// stage - so the new HR decision is always the final decision.
export function hrPushbackStage({
  uuid,
  userEmail,
  hodEmail,
  previousStatus,
  status,
  reason,
  approverEmail,
  approverName,
}: HrPushbackStageProps) {
  const isApproved = status === "approved";
  const showPdfDownload = isApproved;
  const change = `from <strong>${previousStatus}</strong> to <strong>${status}</strong>`;
  const reasonLine = `<br /><br /><strong>Push-back reason:</strong> ${escapeHtml(reason)}`;
  const title = isApproved
    ? `Final Update: Travel Requisition Approved After Push-back By ${approverName}`
    : `Final Update: Travel Requisition Declined After Push-back By ${approverName}`;

  // Acting HR member
  EmailSender({
    to: approverEmail,
    requestId: uuid,
    message: `You have pushed back the HR decision on this travel requisition ${change}.${reasonLine}`,
    title: isApproved
      ? "Final Update: Travel Requisition Approved After Push-back"
      : "Final Update: Travel Requisition Declined After Push-back",
    role: "user",
    showPdfDownload,
  });

  // If submitter is the hod, only send one email
  if (hodEmail !== userEmail) {
    EmailSender({
      to: hodEmail,
      requestId: uuid,
      message: `HR has pushed back their decision on this travel requisition ${change}.${reasonLine}`,
      title,
      role: "user",
      showPdfDownload,
    });
  }

  EmailSender({
    to: userEmail,
    requestId: uuid,
    message: `HR has pushed back their decision on your travel requisition ${change}.${reasonLine}`,
    title,
    role: "user",
    showPdfDownload,
  });

  // Finance
  if (isApproved) {
    // Same as a first-time Tier 1/2 HR approval
    EmailSender({
      to: process.env.FIRST_FINANCE_EMAIL!,
      requestId: uuid,
      message: `This travel requisition has been approved by ${approverName} following an HR push-back (it was previously declined).${reasonLine}`,
      title: `Final Update: Travel Requisition Approved By ${approverName}`,
      role: "user",
      showPdfDownload: true,
    });
  } else {
    EmailSender({
      to: process.env.FIRST_FINANCE_EMAIL!,
      requestId: uuid,
      message: `<strong>Action required:</strong> this travel requisition was previously <strong>approved</strong> and has now been <strong>declined</strong> by ${approverName} following an HR push-back. Please stop any payment, per diem or booking already initiated against it.${reasonLine}`,
      title: `Reversed: Previously Approved Travel Requisition Now Declined By ${approverName}`,
      role: "user",
      showPdfDownload: true,
    });
  }
}
