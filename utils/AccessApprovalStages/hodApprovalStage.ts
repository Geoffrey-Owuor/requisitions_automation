import { AccessEmailSender } from "@/services/AccessEmailSender";
import { loadSecurityArray } from "@/lib/loadAppDataV2";

type HodApprovalStageProps = {
  uuid: string;
  userEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};

export const hodApprovalStage = async ({
  uuid,
  userEmail,
  status,
  approverEmail,
  approverName,
}: HodApprovalStageProps) => {
  const SECURITY_ARRAY = await loadSecurityArray();

  // Hod declined the request - Notify the HOD and submitter
  if (status === "declined") {
    // Hod
    AccessEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this access requisition",
      title: "Final Update: Access Requisition Declined",
      role: "user",
    });

    // Submitter
    AccessEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your access requisition has been declined by ${approverName}`,
      title: "Final Update: Access Requisition Declined",
      role: "user",
    });
  }

  // HOD Approved - Notify Security, HOD, And User
  if (status === "approved") {
    //Security Approvers
    SECURITY_ARRAY.forEach((securityApprover) => {
      AccessEmailSender({
        to: securityApprover.email,
        requestId: uuid,
        message:
          "A new access requisition has been submitted and requires your review",
        title: "Action Required: New Access Requisition",
        role: "security",
        reviewLink: `?token=${securityApprover.uuid}&stage=security`,
      });
    });

    //HOD
    AccessEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this access requisition, it has been forwarded to Security for review",
      title: "Update: Access Requisition Approved",
      role: "user",
    });

    //Submitter
    AccessEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your Access requisition has been approved by ${approverName} and forwarded to Security for review`,
      title: "Update: Access Requisition Approved",
      role: "user",
    });
  }
};
