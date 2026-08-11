import { EmailSender } from "@/services/EmailSender";
import { loadHrArray } from "@/lib/loadAppDataV2";

type HodApprovalStageProps = {
  uuid: string;
  userEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export async function hodApprovalStage({
  uuid,
  userEmail,
  status,
  approverEmail,
  approverName,
}: HodApprovalStageProps) {
  const HR_ARRAY = await loadHrArray();

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

  // HOD approved request - HR approval is mandatory for every tier, so always forward to HR
  if (status === "approved") {
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
