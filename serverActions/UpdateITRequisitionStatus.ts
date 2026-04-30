"use server";
import { UpdateRequestStatusProps } from "./UpdateTravelStatus";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { ITEmailSender } from "@/services/ITEmailSender";
import { itApprovalStage } from "@/utils/ITApprovalStages/itApprovalStage";
import { hodApprovalStage } from "@/utils/ITApprovalStages/hodApprovalStage";

export async function UpdateITRequisitionStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {
  let client: PoolClient | undefined;

  //  Our base update status query
  const baseUpdateQuery = `
  UPDATE it_requisitions
  SET ${payload.stage}_approval_date = CURRENT_TIMESTAMP,
  ${payload.stage}_approver_status = $1,
  ${payload.stage}_approver_name = $2,
  ${payload.stage}_approver_email = $3,
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
      SELECT ${payload.stage}_approval_status AS approval_status,
      ${payload.stage}_approver_name AS approver,
      submitter_email, hod_approver_email
      FROM it_requisitions WHERE request_id = $1 FOR UPDATE
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

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    const hodEmail = reviewedResult[0].hod_approver_email;

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
      case "it":
        itApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      default:
        ITEmailSender({
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
