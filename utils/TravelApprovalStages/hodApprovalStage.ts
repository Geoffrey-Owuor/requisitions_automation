import { EmailSender } from "@/services/EmailSender";
import { HR_ARRAY } from "@/secretAssets";

type HodApprovalStageProps = {
  uuid: string;
  userEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  approvalTier: string;
};
export function hodApprovalStage({
  uuid,
  userEmail,
  status,
  approverEmail,
  approverName,
  approvalTier,
}: HodApprovalStageProps) {
  // HOD declined the request - Notify the HOD and submitter
  if (status === "declined") {
    // Hod
    EmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this travel requisition.",
      title: "Final Update: Travel Requisition Declined",
      role: "user",
    });

    // Submitter
    EmailSender({
      to: userEmail,
      requestId: uuid,
      message:
        "Your travel requisition has been declined in the HOD approval stage",
      title: `Final Update: Travel Requisition Declined By ${approverName}`,
      role: "user",
    });
  }

  // HOD approved request - check if tier 1 or 2 and send the appropiate emails
  if (status === "approved") {
    if (approvalTier === "Tier 1") {
      // Hod
      EmailSender({
        to: approverEmail,
        requestId: uuid,
        message: "You have approved this travel requisition",
        title: "Final Update: Travel Requisition Approved",
        role: "user",
        showPdfDownload: true,
      });

      // User
      EmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your travel requisition has been approved by ${approverName}`,
        title: `Final Update: Travel Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    } else {
      //  Requisition requires the next approval - HR
      HR_ARRAY.forEach((hrApprover) => {
        EmailSender({
          to: hrApprover.email,
          requestId: uuid,
          message:
            "A new travel requisition has been submitted and requires your approval",
          title: "Action Required: New Travel Requisition",
          role: "HR",
          reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
        });
      });

      // Notify involved parties (Hod and Submitter)
      EmailSender({
        to: approverEmail,
        requestId: uuid,
        message:
          "You have approved this travel requisition. It has been forwarded to HR for the next approval stage",
        title: "Update: Travel Requisition Approved",
        role: "user",
      });

      EmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your travel requisition has been approved by ${approverName} and has been forwaded to HR for the next approval stage`,
        title: `Update: Travel Requisition Approved By ${approverName}`,
        role: "user",
      });
    }
  }
}
