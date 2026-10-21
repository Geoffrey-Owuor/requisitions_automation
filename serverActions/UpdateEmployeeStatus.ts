"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { getHodActionError } from "@/lib/hodAssignment";
import { resolveApproverByToken } from "@/lib/approverToken";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { employeeApprovalStage } from "@/utils/EmployeeApprovalStages/approvalStage";
import { EMPLOYEE_STAGE_LABELS, isValidEmployeeStage } from "@/public/assets";
import {
  EmployeeChainStatuses,
  hasReachedEmployeeStage,
} from "@/lib/employeeApprovalOrder";
import { isDirectorEmail } from "@/utils/isDirectorEmail";
import { isRetailDirectorEmail } from "@/utils/isRetailDirectorEmail";

export type UpdateRequestStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  // The emailed link's approval token - the acting approver is resolved
  // from it server-side (lib/approverToken.ts), never from the client.
  token: string;
  // The amendment_count the approver's screen was rendered from - guards
  // against approving content that was superseded by an amendment while
  // this approver had the page open.
  expectedAmendmentCount: number;
};

export async function UpdateEmployeeStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {
  if (!isValidEmployeeStage(payload.stage)) {
    return {
      alertType: "error",
      alertMessage: "Invalid approval stage provided",
    };
  }

  let client: PoolClient | undefined;

  // Our base update query and params. At the HOD stage employee_hod_email is
  // the ASSIGNED HOD and is never overwritten - whoever acted (assigned HOD
  // or an alternate) is recorded in employee_hod_actioned_by_email instead.
  const approverEmailColumn =
    payload.stage === "hod"
      ? "employee_hod_actioned_by_email"
      : `employee_${payload.stage}_email`;

  const baseUpdateQuery = `
    UPDATE employee_requisitions
    SET employee_${payload.stage}_approval_date = CURRENT_TIMESTAMP,
    employee_${payload.stage}_approval_status = $1,
    employee_${payload.stage}_approver = $2,
    ${approverEmailColumn} = $3,
    employee_${payload.stage}_comments = $4
    WHERE request_id = $5
    `;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Check if the requisition has already been acted upon
    const { rows: reviewedResult } = await client.query(
      `SELECT employee_${payload.stage}_approval_status AS approval_status,
       employee_${payload.stage}_approver AS approver,
       submitter_email, employee_hod_email,
       employee_retail_director_approval_status AS retail_director_approval_status,
       COALESCE(employee_hod_actioned_by_email, employee_hod_email) AS employee_hod_actioned_by_email,
       employee_hod_approval_status AS hod_approval_status,
       employee_hod_approver AS hod_approver_name,
       employee_retail_director_email, employee_director_email, employee_hr_email,
       employee_director_approval_status AS director_approval_status,
       employee_hr_approval_status AS hr_approval_status,
       hr_before_director, amendment_count
        FROM employee_requisitions WHERE request_id = $1 FOR UPDATE`,
      [payload.uuid],
    );

    if (reviewedResult.length === 0) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "The selected requisition for update could not be found, please contact your admin for support",
      };
    }

    // The acting approver comes from the approval token, never from the
    // client. HR approvers are additionally scoped to the forms in their
    // hr_forms allow-list - salary advance never reaches this check.
    const approver = await resolveApproverByToken(
      client,
      payload.stage,
      payload.token,
      "employee",
    );

    if (!approver.ok) {
      await client.query("ROLLBACK");
      return { alertType: "error", alertMessage: approver.message };
    }

    const { name: approverName, email: approverEmail } = approver;

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    // Decided at submission/amendment from the department's flag and stored
    // as 'N/A' when the stage doesn't apply
    const hasRetailDirectorStage =
      reviewedResult[0].retail_director_approval_status !== "N/A";
    const assignedHodEmail = reviewedResult[0].employee_hod_email;
    // Later-stage emails go to whoever actually acted on the HOD stage
    const hodEmail = reviewedResult[0].employee_hod_actioned_by_email;
    const retailDirectorEmail = reviewedResult[0].employee_retail_director_email;
    let directorEmail = reviewedResult[0].employee_director_email;
    const hrEmail = reviewedResult[0].employee_hr_email;
    const hrBeforeDirector: boolean = reviewedResult[0].hr_before_director;

    // Only the assigned HOD or one of their alternates may act on the HOD
    // stage - being in hod_array alone is not enough (lib/hodAssignment.ts).
    if (payload.stage === "hod") {
      const hodActionError = await getHodActionError(client, {
        approverEmail,
        assignedHodEmail,
        submitterEmail: userEmail,
      });
      if (hodActionError) {
        await client.query("ROLLBACK");
        return { alertType: "error", alertMessage: hodActionError };
      }
    }

    // Retail Director is only part of the chain when the requisition has that
    // stage - reject action on it otherwise, even if a valid retail director
    // approval token is used.
    if (payload.stage === "retail_director" && !hasRetailDirectorStage) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This approval stage does not apply to this requisition, no action is required",
      };
    }

    if (reviewedResult[0].amendment_count !== payload.expectedAmendmentCount) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This requisition was amended while you were reviewing it - please reload and try again",
      };
    }

    if (isReviewed !== "pending" && isReviewed !== "N/A") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${previousApprover}, no further action is required`,
      };
    }

    // Stages are acted on in order (lib/employeeApprovalOrder.ts) - an array
    // approver's token works on any requisition, so a hand-made link must
    // not let them act before the earlier stages have approved.
    const chain: EmployeeChainStatuses = {
      hrBeforeDirector,
      hod: reviewedResult[0].hod_approval_status,
      retailDirector: reviewedResult[0].retail_director_approval_status,
      director: reviewedResult[0].director_approval_status,
      hr: reviewedResult[0].hr_approval_status,
    };

    if (!hasReachedEmployeeStage(chain, payload.stage)) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition hasn't reached the ${EMPLOYEE_STAGE_LABELS[payload.stage]} approval stage yet, no action is required`,
      };
    }

    await client.query(baseUpdateQuery, [
      payload.status,
      approverName,
      approverEmail,
      payload.comments,
      payload.uuid,
    ]);

    if (payload.stage === "hod") chain.hod = payload.status;
    if (payload.stage === "retail_director")
      chain.retailDirector = payload.status;
    if (payload.stage === "director") chain.director = payload.status;
    if (payload.stage === "hr") chain.hr = payload.status;

    // The same person is never asked to approve twice under two different
    // roles: when the HOD is also a Retail Director, approving the HOD stage
    // approves the Retail Director stage too; when they are also a
    // Director/CEO, the CEO stage is approved for them as soon as the stage
    // before it approves - HR, or on the original order the HOD stage itself.
    // The two checks are independent - a person can hold both roles at once.
    const autoApprove = async (
      stage: "retail_director" | "director",
      email: string,
      name: string,
      comment: string,
    ) => {
      await client!.query(
        `
        UPDATE employee_requisitions
        SET employee_${stage}_approval_date = CURRENT_TIMESTAMP,
        employee_${stage}_approval_status = 'approved',
        employee_${stage}_approver = $1,
        employee_${stage}_email = $2,
        employee_${stage}_comments = $3
        WHERE request_id = $4
        `,
        [name, email, comment, payload.uuid],
      );
      if (stage === "retail_director") chain.retailDirector = "approved";
      else {
        chain.director = "approved";
        directorEmail = email;
      }
    };
    const directorComment =
      "Automatically approved - the HOD is also a Director/CEO, so a separate CEO approval is not required";

    if (payload.stage === "hod" && payload.status === "approved") {
      if (
        hasRetailDirectorStage &&
        (await isRetailDirectorEmail(client, approverEmail))
      ) {
        await autoApprove(
          "retail_director",
          approverEmail,
          approverName,
          "Automatically approved - the HOD is also a Retail Director, so a separate Retail Director approval is not required",
        );
      }

      if (!hrBeforeDirector && (await isDirectorEmail(client, approverEmail))) {
        await autoApprove("director", approverEmail, approverName, directorComment);
      }
    }

    // On the HR -> CEO order, auto-approve the CEO stage for a HOD who is a
    // Director/CEO once HR approves, which makes HR's approval the final one.
    // The approver name recorded is the HOD's, as on the HOD-stage path.
    if (
      payload.stage === "hr" &&
      payload.status === "approved" &&
      hrBeforeDirector &&
      (await isDirectorEmail(client, hodEmail))
    ) {
      await autoApprove(
        "director",
        hodEmail,
        reviewedResult[0].hod_approver_name,
        directorComment,
      );
    }

    await client.query("COMMIT");

    employeeApprovalStage({
      uuid: payload.uuid,
      stage: payload.stage,
      status: payload.status,
      approverEmail,
      approverName,
      userEmail,
      // At the HOD stage the approver is the HOD
      hodEmail: payload.stage === "hod" ? approverEmail : hodEmail,
      chain,
      otherApproverEmails: [retailDirectorEmail, directorEmail, hrEmail],
    });

    return {
      alertType: "success",
      alertMessage:
        "This requisition status has been updated successfully, you may now safely close this window",
    };
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error(
      "Error while trying to update the status of this requisition",
      error,
    );
    return {
      alertType: "error",
      alertMessage:
        "An error occured while trying to update the status of this requisition",
    };
  } finally {
    if (client) client.release();
  }
}
