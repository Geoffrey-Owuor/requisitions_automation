import { CasualEmailSender } from "@/services/CasualEmailSender";

type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  financeEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  financeEmail,
  status,
  approverEmail,
  approverName,
}: HrApprovalStageProps) {
  if (status === "declined") {
    // Hr
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this casual requisition.",
      title: "Final Update: Casual Requisition Declined",
      role: "user",
    });

    if (hodEmail === userEmail) {
      CasualEmailSender({
        to: [financeEmail, userEmail],
        requestId: uuid,
        message:
          "This casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      CasualEmailSender({
        to: [hodEmail, financeEmail],
        requestId: uuid,
        message:
          "This casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });

      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    // Hr
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have approved this casual requisition",
      title: "Final Update: Casual Requisition Approved",
      role: "user",
      showPdfDownload: true,
    });

    if (hodEmail === userEmail) {
      // Finance and Submitter (who is also the HOD)
      CasualEmailSender({
        to: [financeEmail, userEmail],
        requestId: uuid,
        message: `This casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    } else {
      // Hod and Finance
      CasualEmailSender({
        to: [hodEmail, financeEmail],
        requestId: uuid,
        message: `This casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
      // User
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    }
  }
}
