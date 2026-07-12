import { ITEmailSender } from "@/services/ITEmailSender";
import { loadITArray } from "@/lib/loadAppDataV2";

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
  const IT_ARRAY = await loadITArray();

  // Hod declined the request - Notify the HOD and submitter
  if (status === "declined") {
    // Hod
    ITEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this IT requisition",
      title: "Final Update: IT Requisition Declined",
      role: "user",
    });

    // Submitter
    ITEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your IT requisition has been declined by ${approverName}`,
      title: "Final Update: IT Requisition Declined",
      role: "user",
    });
  }

  // HOD Approved - Notify IT, HOD, And User
  if (status === "approved") {
    //IT Approvers
    IT_ARRAY.forEach((itApprover) => {
      ITEmailSender({
        to: itApprover.email,
        requestId: uuid,
        message:
          "A new IT requisition has been submitted and requires your review",
        title: "Action Required: New IT Requisition",
        role: "IT",
        reviewLink: `?token=${itApprover.uuid}&stage=it`,
      });
    });

    //HOD
    ITEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this IT requisition, it has been forwarded to IT for review",
      title: "Update: IT Requisition Approved",
      role: "user",
    });

    //Submitter
    ITEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your IT requisition has been approved by ${approverName} and forwarded to IT for review`,
      title: "Update: IT Requisition Approved",
      role: "user",
    });
  }
}
