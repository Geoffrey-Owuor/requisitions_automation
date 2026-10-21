import { PoolClient } from "pg";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import { loadHodAlternates, sameEmail } from "@/lib/hodAssignment";
import { isRetailDirectorEmail } from "@/utils/isRetailDirectorEmail";
import {
  notifyStageApprovers,
  stageForwardedTo,
} from "@/utils/EmployeeApprovalStages/approvalStage";

// Shared by the initial submission route and the amendment route: both start
// the approval chain from the HOD stage on the HOD -> Retail Director -> HR
// -> CEO order (hr_before_director, set by both routes), with the same
// auto-approvals when the submitter is their own HOD.

// The first stage still waiting on someone once auto-approvals are applied
export type EmployeeFirstPendingStage = "hod" | "retail_director" | "hr";

type AutoApprovalProps = {
  requestId: string;
  // From the department's requires_retail_director flag (lib/departments.ts)
  hasRetailDirectorStage: boolean;
  submitterEmail: string;
  submitterName: string;
  hodEmail: string;
};

/**
 * Applies the self-HOD auto-approvals inside the caller's transaction, on a
 * requisition whose stages are all freshly pending. If the submitter is their
 * own HOD, the HOD stage auto-approves, and so - mirroring the HOD-approval
 * path in UpdateEmployeeStatus - does the Retail Director stage of a retail
 * requisition if that HOD is a Retail Director. Returns the first stage still
 * pending. A HOD who is a Director/CEO has the CEO stage auto-approved later,
 * when HR approves (UpdateEmployeeStatus), since the CEO stage comes last.
 */
export async function applySubmissionAutoApprovals(
  client: PoolClient,
  {
    requestId,
    hasRetailDirectorStage,
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
  // two different roles
  if (!hasRetailDirectorStage) return "hr";
  if (!(await isRetailDirectorEmail(client, hodEmail))) return "retail_director";

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

  return "hr";
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
    case "retail_director":
    case "hr": {
      await notifyStageApprovers(
        firstPendingStage,
        requestId,
        approverMessage,
        approverTitle,
      );

      const forwardedTo = stageForwardedTo(firstPendingStage);
      notifySubmitter(
        `Your employee requisition has been successfully submitted and forwarded to ${forwardedTo} for approval`,
        forwardedTo,
      );
      break;
    }
  }
}
