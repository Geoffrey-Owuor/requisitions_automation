import { AccessEmailSender } from "@/services/AccessEmailSender";

type SecurityApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};

export async function securityApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
}: SecurityApprovalStageProps) {
  // Security Declined - Notify Security, HOD, and Submitter
  if (status === "declined") {
    // Security
    AccessEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this access requisition",
      title: "Final Update: Access Requisition Declined",
      role: "user",
    });

    if (hodEmail === userEmail) {
      AccessEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your access Requisition has been declined by ${approverName}`,
        title: "Final Update: Access Requisition Declined",
        role: "user",
      });
    } else {
      AccessEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This access Requisition has been declined by ${approverName}`,
        title: "Final Update: Access Requisition Declined",
        role: "user",
      });

      AccessEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your access Requisition has been declined by ${approverName}`,
        title: "Final Update: Access Requisition Declined",
        role: "user",
      });
    }
  }

  //Security Approved - Notify Security, HOD, and Submitter
  if (status === "approved") {
    // Security
    AccessEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have approved this access requisition",
      title: "Final Update: Access Requisition Approved",
      role: "user",
      showPdfDownload: true,
    });

    if (hodEmail === userEmail) {
      AccessEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your access requisition has been approved by ${approverName}`,
        title: "Final Update: Access Requisition Approved",
        role: "user",
        showPdfDownload: true,
      });
    } else {
      AccessEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This access requisition has been approved by ${approverName}`,
        title: "Final Update: Access Requisition Approved",
        role: "user",
        showPdfDownload: true,
      });

      AccessEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your access requisition has been approved by ${approverName}`,
        title: "Final Update: Access Requisition Approved",
        role: "user",
        showPdfDownload: true,
      });
    }
  }
}
