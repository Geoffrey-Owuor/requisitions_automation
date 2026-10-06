import { PoolClient } from "pg";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import {
  loadDirectorArray,
  loadHrArray,
  loadRetailDirectorArray,
} from "@/lib/loadApprovers";
import { loadHodAlternates, sameEmail } from "@/lib/hodAssignment";
import { isDirectorEmail } from "@/utils/isDirectorEmail";
import { isRetailDirectorEmail } from "@/utils/isRetailDirectorEmail";
import { RETAIL_DEPARTMENT } from "@/public/assets";

// Shared by the initial submission route and the amendment route: both start
// the approval chain from the HOD stage, with the same auto-approvals when
// the submitter is their own HOD.

// The first stage still waiting on someone once auto-approvals are applied
export type EmployeeFirstPendingStage =
  | "hod"
  | "retail_director"
  | "director"
  | "hr";

type AutoApprovalProps = {
  requestId: string;
  department: string;
  submitterEmail: string;
  submitterName: string;
  hodEmail: string;
};

/**
 * Applies the self-HOD auto-approvals inside the caller's transaction, on a
 * requisition whose stages are all freshly pending. If the submitter is their
 * own HOD, the HOD stage auto-approves, and then - independently, mirroring
 * the HOD-approval path in UpdateEmployeeStatus - so does the Retail Director
 * stage of a retail requisition if that HOD is a Retail Director, and the CEO
 * stage if they are a Director/CEO. Returns the first stage still pending: a
 * retail requisition whose HOD isn't a Retail Director waits there even when
 * the CEO stage auto-approved, and goes straight to HR once it's approved
 * (retailDirectorApprovalStage).
 */
export async function applySubmissionAutoApprovals(
  client: PoolClient,
  {
    requestId,
    department,
    submitterEmail,
    submitterName,
    hodEmail,
  }: AutoApprovalProps,
): Promise<EmployeeFirstPendingStage> {
  if (!sameEmail(hodEmail, submitterEmail)) return "hod";

  await client.query(
    `
    UPDATE employee_requisitions
    SET
    employee_hod_approval_date = CURRENT_TIMESTAMP,
    employee_hod_actioned_by_email = $1,
    employee_hod_approval_status = $2,
    employee_hod_comments = $3
    WHERE request_id = $4
    `,
    [hodEmail, "approved", "Automatic HOD Approval", requestId],
  );

  // Never ask the same person to approve their own requisition twice under
  // two different roles. The two checks are independent - a person can hold
  // both roles, or only one of them.
  let retailDirectorPending = false;

  if (department === RETAIL_DEPARTMENT) {
    const hodIsRetailDirector = await isRetailDirectorEmail(client, hodEmail);

    if (hodIsRetailDirector) {
      await client.query(
        `
        UPDATE employee_requisitions
        SET employee_retail_director_approval_date = CURRENT_TIMESTAMP,
        employee_retail_director_approval_status = $1,
        employee_retail_director_approver = $2,
        employee_retail_director_email = $3,
        employee_retail_director_comments = $4
        WHERE request_id = $5
        `,
        [
          "approved",
          submitterName,
          hodEmail,
          "Automatically approved - the HOD is also a Retail Director, so a separate Retail Director approval is not required",
          requestId,
        ],
      );
    } else {
      retailDirectorPending = true;
    }
  }

  const hodIsDirector = await isDirectorEmail(client, hodEmail);

  if (hodIsDirector) {
    await client.query(
      `
      UPDATE employee_requisitions
      SET employee_director_approval_date = CURRENT_TIMESTAMP,
      employee_director_approval_status = $1,
      employee_director_approver = $2,
      employee_director_email = $3,
      employee_director_comments = $4
      WHERE request_id = $5
      `,
      [
        "approved",
        submitterName,
        hodEmail,
        "Automatically approved - the HOD is also a Director/CEO, so a separate CEO approval is not required",
        requestId,
      ],
    );
  }

  if (retailDirectorPending) return "retail_director";
  return hodIsDirector ? "hr" : "director";
}

type SubmissionStageProps = {
  requestId: string;
  submitterEmail: string;
  hodEmail: string;
  hodUuid: string;
  firstPendingStage: EmployeeFirstPendingStage;
  // Set when this is an amendment restarting the chain rather than a new
  // submission - changes the wording of every email
  amenderName?: string;
};

/**
 * Sends the emails for a requisition entering the approval chain (after the
 * transaction that applied applySubmissionAutoApprovals has committed): the
 * first pending stage's approvers, and the submitter.
 */
export async function submissionStage({
  requestId,
  submitterEmail,
  hodEmail,
  hodUuid,
  firstPendingStage,
  amenderName,
}: SubmissionStageProps) {
  const isAmendment = amenderName !== undefined;

  const approverMessage = isAmendment
    ? `This employee requisition was amended by ${amenderName} and requires your approval. This supersedes any earlier notification for this requisition, and links to replaced attachments in earlier emails no longer work.`
    : "A new employee requisition has been submitted and requires your approval";
  const approverTitle = isAmendment
    ? "Action Required: Amended Employee Requisition"
    : "Action Required: New Employee Requisition";

  const notifySubmitter = (submittedMessage: string, forwardedTo: string) =>
    EmployeeEmailSender({
      to: submitterEmail,
      requestId,
      message: isAmendment
        ? `Your amendment has been submitted successfully. This supersedes any earlier notification for this requisition and the approval workflow has restarted - it has been forwarded to ${forwardedTo} for approval.`
        : submittedMessage,
      title: isAmendment
        ? "Update: Employee Requisition Amended"
        : "Update: Employee requisition submitted successfully",
      role: "user",
    });

  switch (firstPendingStage) {
    case "hod": {
      EmployeeEmailSender({
        to: hodEmail,
        requestId,
        message: approverMessage,
        title: isAmendment
          ? approverTitle
          : "Action Required: Employee Requisition Review",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });
      // The HOD's alternates can also act on the HOD stage (first click wins)
      const hodAlternates = await loadHodAlternates(hodEmail, submitterEmail);
      for (const alternate of hodAlternates) {
        EmployeeEmailSender({
          to: alternate.email,
          requestId,
          message: isAmendment
            ? `This employee requisition was amended by ${amenderName} and requires your approval as an alternate HOD approver. This supersedes any earlier notification for this requisition, and links to replaced attachments in earlier emails no longer work.`
            : "A new employee requisition has been submitted and requires your approval as an alternate HOD approver",
          title: isAmendment
            ? approverTitle
            : "Action Required: Employee Requisition Review",
          role: "HOD",
          reviewLink: `?token=${alternate.uuid}&stage=hod`,
        });
      }

      EmployeeEmailSender({
        to: submitterEmail,
        requestId,
        message: isAmendment
          ? "Your amendment has been submitted successfully. This supersedes any earlier notification for this requisition and the approval workflow has restarted - it has been forwarded to the HOD for approval."
          : "Your employee requisition has been submitted successfully and forwarded to the HOD for approval.",
        title: isAmendment
          ? "Update: Employee Requisition Amended"
          : "Update: Employee Requisition Successfully Submitted",
        role: "user",
      });
      break;
    }
    case "retail_director": {
      const RETAIL_DIRECTOR_ARRAY = await loadRetailDirectorArray();

      RETAIL_DIRECTOR_ARRAY.forEach((retailDirectorApprover) => {
        EmployeeEmailSender({
          to: retailDirectorApprover.email,
          requestId,
          message: approverMessage,
          title: approverTitle,
          role: "Retail Director",
          reviewLink: `?token=${retailDirectorApprover.uuid}&stage=retail_director`,
        });
      });

      notifySubmitter(
        "Your employee requisition has been successfully submitted and forwarded to the Retail Director for approval",
        "the Retail Director",
      );
      break;
    }
    case "director": {
      const DIRECTOR_ARRAY = await loadDirectorArray();

      DIRECTOR_ARRAY.forEach((directorApprover) => {
        EmployeeEmailSender({
          to: directorApprover.email,
          requestId,
          message: approverMessage,
          title: approverTitle,
          role: "CEO",
          reviewLink: `?token=${directorApprover.uuid}&stage=director`,
        });
      });

      notifySubmitter(
        "Your employee requisition has been successfully submitted and forwarded to the CEO for approval",
        "the CEO",
      );
      break;
    }
    case "hr": {
      const HR_ARRAY = await loadHrArray("employee");

      HR_ARRAY.forEach((hrApprover) => {
        EmployeeEmailSender({
          to: hrApprover.email,
          requestId,
          message: approverMessage,
          title: approverTitle,
          role: "HR",
          reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
        });
      });

      notifySubmitter(
        "Your employee requisition has been successfully submitted. As you are also a Director/CEO, the CEO approval stage was automatically approved and this has been forwarded to HR for approval",
        "HR (the CEO stage was automatically approved, as you are also a Director/CEO)",
      );
      break;
    }
  }
}
