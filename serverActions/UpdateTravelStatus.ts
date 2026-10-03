"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { getHodActionError } from "@/lib/hodAssignment";
import { resolveApproverByToken } from "@/lib/approverToken";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { hodApprovalStage } from "@/utils/TravelApprovalStages/hodApprovalStage";
import { hrApprovalStage } from "@/utils/TravelApprovalStages/hrApprovalStage";
import { directorApprovalStage } from "@/utils/TravelApprovalStages/directorApprovalStage";
import { EmailSender } from "@/services/EmailSender";
import { isValidTravelStage } from "@/public/assets";
import { isDirectorEmail } from "@/utils/isDirectorEmail";

export type UpdateRequestStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  // The emailed link's approval token - the acting approver is resolved
  // from it server-side (lib/approverToken.ts), never from the client.
  token: string;
};

export type UpdateTravelStatusProps = UpdateRequestStatusProps & {
  // The amendment_count the approver's screen was rendered from - guards
  // against approving content that was superseded by an amendment while
  // the approver was reviewing it.
  expectedAmendmentCount: number;
};

export async function UpdateTravelStatus(
  payload: UpdateTravelStatusProps,
): Promise<AlertInfo> {
  if (!isValidTravelStage(payload.stage)) {
    return {
      alertType: "error",
      alertMessage: "Invalid approval stage provided",
    };
  }

  let client: PoolClient | undefined;

  // Our base update query and params. At the HOD stage travel_hod_email is
  // the ASSIGNED HOD and is never overwritten - whoever acted (assigned HOD
  // or an alternate) is recorded in travel_hod_actioned_by_email instead.
  const approverEmailColumn =
    payload.stage === "hod"
      ? "travel_hod_actioned_by_email"
      : `travel_${payload.stage}_email`;

  const baseUpdateQuery = `
    UPDATE travel_requisitions
    SET travel_${payload.stage}_approval_date = CURRENT_TIMESTAMP,
    travel_${payload.stage}_approval_status = $1,
    travel_${payload.stage}_approver = $2,
    ${approverEmailColumn} = $3,
    travel_${payload.stage}_comments = $4
    WHERE request_id = $5
    `;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Check if the requisition has already been acted upon
    const { rows: reviewedResult } = await client.query(
      `SELECT travel_${payload.stage}_approval_status AS approval_status,
       travel_${payload.stage}_approver AS approver,
       travel_approval_tier, submitter_email, travel_hod_email, travel_hod_approver, travel_hr_email,
       COALESCE(travel_hod_actioned_by_email, travel_hod_email) AS travel_hod_actioned_by_email,
       amendment_count
        FROM travel_requisitions WHERE request_id = $1 FOR UPDATE`,
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
      "travel",
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
    const assignedHodEmail = reviewedResult[0].travel_hod_email;
    // Whoever actually acted on the HOD stage (assigned HOD or an alternate) -
    // later-stage emails and the Director auto-approve check use this person.
    // travel_hod_approver already holds their name once the stage is acted on.
    const hodEmail = reviewedResult[0].travel_hod_actioned_by_email;
    const hodApprover = reviewedResult[0].travel_hod_approver;
    const hrEmail = reviewedResult[0].travel_hr_email;
    const approvalTier = reviewedResult[0].travel_approval_tier;

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

    // Director is only part of the chain for Tier 3 - reject action on that
    // stage for lower tiers even if a valid director approval token is used.
    if (payload.stage === "director" && approvalTier !== "Tier 3") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This approval stage does not apply to this requisition, no action is required",
      };
    }

    if (isReviewed !== "pending" && isReviewed !== "N/A") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${previousApprover}, no further action is required`,
      };
    }

    if (
      reviewedResult[0].amendment_count !==
      Number(payload.expectedAmendmentCount)
    ) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This requisition was amended while you were reviewing it - please reload and try again",
      };
    }

    await client.query(baseUpdateQuery, [
      payload.status,
      approverName,
      approverEmail,
      payload.comments,
      payload.uuid,
    ]);

    // If HR is approving a Tier 3 requisition whose acting HOD (the assigned
    // HOD or the alternate who approved) is also a Director,
    // auto-approve the Director stage in the same transaction so the same
    // person is never asked to approve twice under two different roles.
    let skipDirectorStage = false;
    if (
      payload.stage === "hr" &&
      payload.status === "approved" &&
      approvalTier === "Tier 3"
    ) {
      skipDirectorStage = await isDirectorEmail(client, hodEmail);

      if (skipDirectorStage) {
        await client.query(
          `
          UPDATE travel_requisitions
          SET travel_director_approval_date = CURRENT_TIMESTAMP,
          travel_director_approval_status = 'approved',
          travel_director_approver = $1,
          travel_director_email = $2,
          travel_director_comments = 'Automatically approved - the approving HOD is also a Director, so a separate Director approval is not required'
          WHERE request_id = $3
          `,
          [hodApprover, hodEmail, payload.uuid],
        );
      }
    }

    await client.query("COMMIT");

    switch (payload.stage) {
      case "hod":
        hodApprovalStage({
          uuid: payload.uuid,
          userEmail,
          status: payload.status,
          approverEmail,
          approverName,
        });
        break;
      case "hr":
        hrApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail,
          approverName,
          approvalTier,
          skipDirectorStage,
        });
        break;
      case "director":
        directorApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          hrEmail,
          status: payload.status,
          approverEmail,
          approverName,
        });
        break;
      default:
        EmailSender({
          to: "geoffrey@hotpoint.co.ke",
          requestId: payload.uuid,
          message:
            "A wrong stage was passed in the travel requisition approval workflow for this requistion",
          title: "Wrong stage passed to travel requisition approval workflow",
          role: "user",
        });
        break;
    }

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
