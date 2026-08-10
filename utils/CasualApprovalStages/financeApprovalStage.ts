import { loadHrArray } from "@/lib/loadAppDataV2";
import { CasualEmailSender } from "@/services/CasualEmailSender";

type FinanceApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export async function financeApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
}: FinanceApprovalStageProps) {
  const HR_ARRAY = await loadHrArray();

  if (status === "declined") {
    // Finance
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this casual requisition.",
      title: "Final Update: Casual Requisition Declined",
      role: "user",
    });

    // If submitter is the hod, only send one email
    if (hodEmail === userEmail) {
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your casual requisition has been declined in the Finance approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      CasualEmailSender({
        to: hodEmail,
        requestId: uuid,
        message:
          "This casual requisition has been declined in the Finance approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
      // Submitter
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your casual requisition has been declined in the Finance approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    // Requires the next stage - HR approval
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

    // --- Send mail to involved parties ---
    // Finance
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this casual requisition. It has been forwarded to HR for the next approval stage",
      title: "Update: Casual Requisition Approved",
      role: "user",
    });

    if (hodEmail === userEmail) {
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your casual requisition has been approved by ${approverName} and has been forwaded to HR for the next approval stage`,
        title: `Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      CasualEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This casual requisition has been approved by ${approverName} and has been forwaded to HR for the next approval stage`,
        title: `Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
      });
      // User
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your casual requisition has been approved by ${approverName} and has been forwaded to HR for the next approval stage`,
        title: `Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
      });
    }
  }
}
