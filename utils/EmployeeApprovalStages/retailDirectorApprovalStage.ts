import { loadDirectorArray, loadHrArray } from "@/lib/loadAppDataV2";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";

type RetailDirectorApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  skipDirectorStage?: boolean;
};
export async function retailDirectorApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
  skipDirectorStage = false,
}: RetailDirectorApprovalStageProps) {
  if (status === "declined") {
    // Retail Director
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
          "Your employee requisition has been declined in the Retail Director approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      EmployeeEmailSender({
        to: hodEmail,
        requestId: uuid,
        message:
          "This employee requisition has been declined in the Retail Director approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
      // Submitter
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your employee requisition has been declined in the Retail Director approval stage",
        title: `Final Update: Employee Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  // Retail Director approved request - forward to CEO for the next
  // approval stage, unless the HOD approval already auto-approved the CEO
  // stage too (HOD is also a Director/CEO), in which case forward to HR.
  if (status === "approved") {
    if (skipDirectorStage) {
      const HR_ARRAY = await loadHrArray();

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

      // Notify involved parties (Retail Director, Hod and Submitter)
      EmployeeEmailSender({
        to: approverEmail,
        requestId: uuid,
        message:
          "You have approved this employee requisition. As the HOD is also a Director/CEO, the CEO approval stage was automatically approved and this has been forwarded to HR for the next approval stage",
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
        EmployeeEmailSender({
          to: hodEmail,
          requestId: uuid,
          message: `This employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
          title: `Update: Employee Requisition Approved By ${approverName}`,
          role: "user",
        });
        EmployeeEmailSender({
          to: userEmail,
          requestId: uuid,
          message: `Your employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
          title: `Update: Employee Requisition Approved By ${approverName}`,
          role: "user",
        });
      }

      return;
    }

    const DIRECTOR_ARRAY = await loadDirectorArray();

    DIRECTOR_ARRAY.forEach((directorApprover) => {
      EmployeeEmailSender({
        to: directorApprover.email,
        requestId: uuid,
        message:
          "A new employee requisition has been submitted and requires your approval",
        title: "Action Required: New Employee Requisition",
        role: "CEO",
        reviewLink: `?token=${directorApprover.uuid}&stage=director`,
      });
    });

    // --- Send mail to involved parties ---
    // Retail Director
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this employee requisition. It has been forwarded to the CEO for the next approval stage",
      title: "Update: Employee Requisition Approved",
      role: "user",
    });

    if (hodEmail === userEmail) {
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to the CEO for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
    } else {
      // Hod
      EmployeeEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName} and has been forwarded to the CEO for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
      // User
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to the CEO for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });
    }
  }
}
