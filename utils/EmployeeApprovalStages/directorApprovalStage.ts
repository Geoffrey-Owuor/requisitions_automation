import { loadHrArray } from "@/lib/loadAppDataV2";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";

type DirectorApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export async function directorApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
}: DirectorApprovalStageProps) {
  const HR_ARRAY = await loadHrArray();

  if (status === "declined") {
    // Director (CEO)
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this employee requisition.",
      title: "Final Update: Employee Requisition Declined",
      role: "user",
    });

    // If submitter is the hod, only send one email
    if (hodEmail === userEmail) {
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your employee requisition has been declined in the CEO approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      EmployeeEmailSender({
        to: hodEmail,
        requestId: uuid,
        message:
          "This employee requisition has been declined in the CEO approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
      // Submitter
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your employee requisition has been declined in the CEO approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    // Requires the next stage - HR approval
    HR_ARRAY.forEach((hrApprover) => {
      EmployeeEmailSender({
        to: hrApprover.email,
        requestId: uuid,
        message:
          "A new employee requisition has been submitted and requires your approval",
        title: "Action Required: New Employee Requisition",
        role: "HR",
        reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
      });
    });

    // --- Send mail to involved parties ---
    // Director (CEO)
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this employee requisition. It has been forwarded to HR for the next approval stage",
      title: "Update: Employee Requisition Approved",
      role: "user",
    });

    if (hodEmail === userEmail) {
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      EmployeeEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
      // User
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
    }
  }
}
