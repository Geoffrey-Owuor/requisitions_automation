import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";

type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  directorEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  directorEmail,
  status,
  approverEmail,
  approverName,
}: HrApprovalStageProps) {
  if (status === "declined") {
    // Hr
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this employee requisition.",
      title: "Final Update: Employee Requisition Declined",
      role: "user",
    });

    if (hodEmail === userEmail) {
      EmployeeEmailSender({
        to: [directorEmail, userEmail],
        requestId: uuid,
        message:
          "This employee requisition has been declined in the HR approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      EmployeeEmailSender({
        to: [hodEmail, directorEmail],
        requestId: uuid,
        message:
          "This employee requisition has been declined in the HR approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });

      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your employee requisition has been declined in the HR approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    // Hr
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have approved this employee requisition",
      title: "Final Update: Employee Requisition Approved",
      role: "user",
      showViewLink: true,
    });

    if (hodEmail === userEmail) {
      // Director (CEO) and Submitter (who is also the HOD)
      EmployeeEmailSender({
        to: [directorEmail, userEmail],
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName}`,
        title: `Final Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
        showViewLink: true,
      });
    } else {
      // Hod and Director (CEO)
      EmployeeEmailSender({
        to: [hodEmail, directorEmail],
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName}`,
        title: `Final Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
        showViewLink: true,
      });
      // User
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName}`,
        title: `Final Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
        showViewLink: true,
      });
    }
  }
}
