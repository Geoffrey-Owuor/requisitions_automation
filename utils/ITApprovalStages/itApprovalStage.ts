import { ITEmailSender } from "@/services/ITEmailSender";

type ITApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};

export async function itApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
}: ITApprovalStageProps) {
  // IT Rejected - Notify IT, HOD, and Submitter
  if (status === "rejected") {
    // IT
    ITEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have rejected this IT requisition",
      title: "Final Update: IT Requisition Rejected",
      role: "user",
    });

    if (hodEmail === userEmail) {
      ITEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your IT Requisition has been rejected by ${approverName}`,
        title: "Final Update: IT Requisition Rejected",
        role: "user",
      });
    } else {
      ITEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This IT Requisition has been rejected by ${approverName}`,
        title: "Final Update: IT Requisition Rejected",
        role: "user",
      });

      ITEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your IT Requisition has been rejected by ${approverName}`,
        title: "Final Update: IT Requisition Rejected",
        role: "user",
      });
    }
  }

  //IT Accepted - Notify IT, HOD, and Submitter
  if (status === "accepted") {
    // IT
    ITEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have accepted this IT requisition",
      title: "Final Update: IT Requisition Accepted",
      role: "user",
    });

    if (hodEmail === userEmail) {
      ITEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your IT Requisition has been accepted by ${approverName}`,
        title: "Final Update: IT Requisition Accepted",
        role: "user",
      });
    } else {
      ITEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This IT Requisition has been accepted by ${approverName}`,
        title: "Final Update: IT Requisition Accepted",
        role: "user",
      });

      ITEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your IT Requisition has been accepted by ${approverName}`,
        title: "Final Update: IT Requisition Accepted",
        role: "user",
      });
    }
  }
}
