"use server";
import { UpdateRequestStatusProps } from "./UpdateTravelStatus";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { getHodActionError } from "@/lib/hodAssignment";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { AccessEmailSender } from "@/services/AccessEmailSender";
import { securityApprovalStage } from "@/utils/AccessApprovalStages/securityApprovalStage";
import { hodApprovalStage } from "@/utils/AccessApprovalStages/hodApprovalStage";
import { isValidAccessStage } from "@/public/assets";

export const UpdateAccessRequisitionStatus = async (
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> => {
  if (!isValidAccessStage(payload.stage)) {
    return {
      alertType: "error",
      alertMessage: "Invalid approval stage provided",
    };
  }

  let client: PoolClient | undefined;

  //  Our base update status query. At the HOD stage hod_approver_email is
  // the ASSIGNED HOD and is never overwritten - whoever acted (assigned HOD
  // or an alternate) is recorded in hod_actioned_by_email instead.
  const approverEmailColumn =
    payload.stage === "hod"
      ? "hod_actioned_by_email"
      : `${payload.stage}_approver_email`;

  const baseUpdateQuery = `
  UPDATE access_requisitions
  SET ${payload.stage}_approval_date = CURRENT_TIMESTAMP,
  ${payload.stage}_approver_status = $1,
  ${payload.stage}_approver_name = $2,
  ${approverEmailColumn} = $3,
  ${payload.stage}_approver_comments = $4
  WHERE request_id = $5
  `;

  // Our base params
  const baseParams = [
    payload.status,
    payload.approverName,
    payload.approverEmail,
    payload.comments,
    payload.uuid,
  ];

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Check if the requisition has already been acted upon
    const { rows: reviewedResult } = await client.query(
      `
      SELECT ${payload.stage}_approver_status AS approval_status,
      ${payload.stage}_approver_name AS approver,
      submitter_email, hod_approver_email,
      COALESCE(hod_actioned_by_email, hod_approver_email) AS hod_actioned_by_email
      FROM access_requisitions WHERE request_id = $1 FOR UPDATE
      `,

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

    // Check if the approver exists in our table array data set
    const { rows: approverResult } = await client.query(
      `SELECT id FROM ${payload.stage}_array WHERE ${payload.stage}_email = $1`,
      [payload.approverEmail],
    );

    if (approverResult.length === 0) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "Could not verify the current approver, please contact your admin for support",
      };
    }

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    const assignedHodEmail = reviewedResult[0].hod_approver_email;
    // Later-stage emails go to whoever actually acted on the HOD stage
    const hodEmail = reviewedResult[0].hod_actioned_by_email;

    // Only the assigned HOD or one of their alternates may act on the HOD
    // stage - being in hod_array alone is not enough (lib/hodAssignment.ts).
    if (payload.stage === "hod") {
      const hodActionError = await getHodActionError(client, {
        approverEmail: payload.approverEmail,
        assignedHodEmail,
        submitterEmail: userEmail,
      });
      if (hodActionError) {
        await client.query("ROLLBACK");
        return { alertType: "error", alertMessage: hodActionError };
      }
    }

    if (isReviewed !== "pending") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${previousApprover}, no further action is required`,
      };
    }

    await client.query(baseUpdateQuery, baseParams);

    await client.query("COMMIT");

    // Email sending logic
    switch (payload.stage) {
      case "hod":
        hodApprovalStage({
          uuid: payload.uuid,
          userEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      case "security":
        securityApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      default:
        AccessEmailSender({
          to: "geoffrey@hotpoint.co.ke",
          requestId: payload.uuid,
          message:
            "A wrong stage was passed in the access requisition approval workflow for this requistion",
          title: "Wrong stage passed to access requisition approval workflow",
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
};
