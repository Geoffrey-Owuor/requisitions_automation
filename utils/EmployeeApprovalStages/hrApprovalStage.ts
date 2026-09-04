import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";

type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  retailDirectorEmail: string;
  directorEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};

/**
 * Hod, Retail Director and Director (CEO) may all be the same person, or
 * overlap with each other, if a single person holds more than one approver
 * role (e.g. the HOD is also a Retail Director/Director) - dedupe before
 * sending so nobody gets duplicate final-update emails.
 */
function collapseApprovers(emails: (string | undefined | null)[]) {
  return [...new Set(emails.filter((email): email is string => !!email))];
}

export function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  retailDirectorEmail,
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
      const others = collapseApprovers([
        retailDirectorEmail,
        directorEmail,
      ]).filter((email) => email !== userEmail);

      EmployeeEmailSender({
        to: others.length > 0 ? [...others, userEmail] : userEmail,
        requestId: uuid,
        message:
          "This employee requisition has been declined in the HR approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      const others = collapseApprovers([
        hodEmail,
        retailDirectorEmail,
        directorEmail,
      ]);

      EmployeeEmailSender({
        to: others.length > 1 ? others : others[0],
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
      const others = collapseApprovers([
        retailDirectorEmail,
        directorEmail,
      ]).filter((email) => email !== userEmail);

      EmployeeEmailSender({
        to: others.length > 0 ? [...others, userEmail] : userEmail,
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName}`,
        title: `Final Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
        showViewLink: true,
      });
    } else {
      const others = collapseApprovers([
        hodEmail,
        retailDirectorEmail,
        directorEmail,
      ]);

      EmployeeEmailSender({
        to: others.length > 1 ? others : others[0],
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
