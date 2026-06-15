import { EmailSender } from "@/services/EmailSender";

type DirectorApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  hrEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export function directorApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  hrEmail,
  status,
  approverEmail,
  approverName,
}: DirectorApprovalStageProps) {
  if (status === "declined") {
    // Director
    EmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this travel requisition.",
      title: "Final Update: Travel Requisition Declined",
      role: "user",
    });

    if (hodEmail === userEmail) {
      // Hr
      EmailSender({
        to: hrEmail,
        requestId: uuid,
        message:
          "This travel requisition has been declined in the Director approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });

      // User
      EmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your travel requisition has been declined in the Director approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      EmailSender({
        to: [hodEmail, hrEmail],
        requestId: uuid,
        message:
          "This travel requisition has been declined in the Director approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });

      EmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your travel requisition has been declined in the Director approval stage",
        title: `Final Update: Travel Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    //  Director
    EmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have approved this travel requisition",
      title: "Final Update: Travel Requisition Approved",
      role: "user",
      showPdfDownload: true,
    });

    if (hodEmail === userEmail) {
      // Hr
      EmailSender({
        to: hrEmail,
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
    } else {
      // Hr and Hod
      EmailSender({
        to: [hrEmail, hodEmail],
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
  }
}
