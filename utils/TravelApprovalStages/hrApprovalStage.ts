import { loadDirectorArray } from "@/lib/loadAppDataV2";
import { EmailSender } from "@/services/EmailSender";

type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  approvalTier: string;
  skipDirectorStage?: boolean;
};
export async function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
  approvalTier,
  skipDirectorStage = false,
}: HrApprovalStageProps) {
  const DIRECTOR_ARRAY = await loadDirectorArray();
  if (status === "declined") {
    // Hr
    EmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this travel requisition.",
      title: "Final Update: Travel Requisition Declined",
      role: "user",
    });

    // If submitter is the hod, only send one email
    if (hodEmail === userEmail) {
      EmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your travel requisition has been declined in the HR approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      // HOD
      EmailSender({
        to: hodEmail,
        requestId: uuid,
        message:
          "This travel requisition has been declined in the HR approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });
      // Submitter
      EmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your travel requisition has been declined in the HR approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    if (
      approvalTier === "Tier 1" ||
      approvalTier === "Tier 2" ||
      skipDirectorStage
    ) {
      // Hr
      EmailSender({
        to: approverEmail,
        requestId: uuid,
        message: "You have approved this travel requisition",
        title: "Final Update: Travel Requisition Approved",
        role: "user",
        showPdfDownload: true,
      });

      if (hodEmail === userEmail) {
        EmailSender({
          to: userEmail,
          requestId: uuid,
          message: `Your travel requisition has been approved by ${approverName}`,
          title: `Final Update: Travel Requisition Approved By ${approverName}`,
          role: "user",
          showPdfDownload: true,
        });
      } else {
        // Hod
        EmailSender({
          to: hodEmail,
          requestId: uuid,
          message: `This travel requisition has been approved by ${approverName}`,
          title: `Final Update: Travel Requisition Approved By ${approverName}`,
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
      }

      // Finance
      EmailSender({
        to: process.env.FIRST_FINANCE_EMAIL!,
        requestId: uuid,
        message: `This travel requisition has been approved by ${approverName}`,
        title: `Final Update: Travel Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    } else {
      // Requires the next stage - Director approval
      DIRECTOR_ARRAY.forEach((directorApprover) => {
        EmailSender({
          to: directorApprover.email,
          requestId: uuid,
          message:
            "A new travel requisition has been submitted and requires your approval",
          title: "Action Required: New Travel Requisition",
          role: "Director",
          reviewLink: `?token=${directorApprover.uuid}&stage=director`,
        });
      });

      // --- Send mail to involved parties---
      // Hr
      EmailSender({
        to: approverEmail,
        requestId: uuid,
        message:
          "You have approved this travel requisition. It has been forwarded to Director Approval for the next approval stage",
        title: "Update: Travel Requisition Approved",
        role: "user",
      });

      if (hodEmail === userEmail) {
        EmailSender({
          to: userEmail,
          requestId: uuid,
          message: `Your travel requisition has been approved by ${approverName} and has been forwaded to Director Approval for the next approval stage`,
          title: `Update: Travel Requisition Approved By ${approverName}`,
          role: "user",
        });
      } else {
        // Hod
        EmailSender({
          to: hodEmail,
          requestId: uuid,
          message: `This travel requisition has been approved by ${approverName} and has been forwaded to Director Approval for the next approval stage`,
          title: `Update: Travel Requisition Approved By ${approverName}`,
          role: "user",
        });

        // User
        EmailSender({
          to: userEmail,
          requestId: uuid,
          message: `Your travel requisition has been approved by ${approverName} and has been forwaded to Director Approval for the next approval stage`,
          title: `Update: Travel Requisition Approved By ${approverName}`,
          role: "user",
        });
      }
    }
  }
}
