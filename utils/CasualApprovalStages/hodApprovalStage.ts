import { CasualEmailSender } from "@/services/CasualEmailSender";
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
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this casual requisition.",
      title: "Final Update: Casual Requisition Declined",
      role: "user",
    });

    // Submitter
    CasualEmailSender({
      to: userEmail,
      requestId: uuid,
      message:
        "Your casual requisition has been declined in the HOD approval stage",
      title: `Final Update: Casual Requisition Declined By ${approverName}`,
      role: "user",
    });
  }

  // HOD approved request - forward to HR for the next approval stage
  if (status === "approved") {
    HR_ARRAY.forEach((hrApprover) => {
      CasualEmailSender({
        to: hrApprover.email,
        requestId: uuid,
        message:
          "A new casual requisition has been submitted and requires your approval",
        title: "Action Required: New Casual Requisition",
        role: "HR",
        reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
      });
    });

    // Notify involved parties (Hod and Submitter)
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this casual requisition. It has been forwarded to HR for the next approval stage",
      title: "Update: Casual Requisition Approved",
      role: "user",
    });

    CasualEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your casual requisition has been approved by ${approverName} and has been forwaded to HR for the next approval stage`,
      title: `Update: Casual Requisition Approved By ${approverName}`,
      role: "user",
    });
  }
}
