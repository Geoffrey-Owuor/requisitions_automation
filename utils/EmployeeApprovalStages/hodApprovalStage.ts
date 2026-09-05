import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import {
  loadDirectorArray,
  loadHrArray,
  loadRetailDirectorArray,
} from "@/lib/loadAppDataV2";
import { RETAIL_DEPARTMENT } from "@/public/assets";

type HodApprovalStageProps = {
  uuid: string;
  userEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  department: string;
  skipRetailDirectorStage?: boolean;
  skipDirectorStage?: boolean;
};
export async function hodApprovalStage({
  uuid,
  userEmail,
  status,
  approverEmail,
  approverName,
  department,
  skipRetailDirectorStage = false,
  skipDirectorStage = false,
}: HodApprovalStageProps) {
  // HOD declined the request - Notify the HOD and submitter
  if (status === "declined") {
    // Hod
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this employee requisition.",
      title: "Final Update: Employee Requisition Declined",
      role: "user",
    });

    // Submitter
    EmployeeEmailSender({
      to: userEmail,
      requestId: uuid,
      message:
        "Your employee requisition has been declined in the HOD approval stage",
      title: `Final Update: Employee Requisition Declined By ${approverName}`,
      role: "user",
    });
  }

  // HOD approved request - Retail requisitions require a Retail Director
  // approval before the CEO stage, unless the HOD is also a Retail Director,
  // in which case that stage was already auto-approved and we fall through
  // to the existing Director/HR routing below.
  if (status === "approved") {
    if (department === RETAIL_DEPARTMENT && !skipRetailDirectorStage) {
      const RETAIL_DIRECTOR_ARRAY = await loadRetailDirectorArray();

      RETAIL_DIRECTOR_ARRAY.forEach((retailDirectorApprover) => {
        EmployeeEmailSender({
          to: retailDirectorApprover.email,
          requestId: uuid,
          message:
            "A new employee requisition has been submitted and requires your approval",
          title: "Action Required: New Employee Requisition",
          role: "Retail Director",
          reviewLink: `?token=${retailDirectorApprover.uuid}&stage=retail_director`,
        });
      });

      // Notify involved parties (Hod and Submitter)
      EmployeeEmailSender({
        to: approverEmail,
        requestId: uuid,
        message:
          "You have approved this employee requisition. It has been forwarded to the Retail Director for the next approval stage",
        title: "Update: Employee Requisition Approved",
        role: "user",
      });

      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to the Retail Director for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });

      return;
    }

    // Forward to CEO for the next approval stage, unless the HOD is also a
    // Director/CEO, in which case that stage was already auto-approved and
    // we forward straight to HR instead.
    if (skipDirectorStage) {
      const HR_ARRAY = await loadHrArray("employee");

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

      // Notify involved parties (Hod and Submitter)
      EmployeeEmailSender({
        to: approverEmail,
        requestId: uuid,
        message:
          "You have approved this employee requisition. As you are also a Director/CEO, the CEO approval stage was automatically approved and this has been forwarded to HR for the next approval stage",
        title: "Update: Employee Requisition Approved",
        role: "user",
      });

      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName} and has been forwarded to HR for the next approval stage`,
        title: `Update: Employee Requisition Approved By ${approverName}`,
        role: "user",
      });

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

    // Notify involved parties (Hod and Submitter)
    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message:
        "You have approved this employee requisition. It has been forwarded to the CEO for the next approval stage",
      title: "Update: Employee Requisition Approved",
      role: "user",
    });

    EmployeeEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your employee requisition has been approved by ${approverName} and has been forwarded to the CEO for the next approval stage`,
      title: `Update: Employee Requisition Approved By ${approverName}`,
      role: "user",
    });
  }
}
