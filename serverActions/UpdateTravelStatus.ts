"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { hodApprovalStage } from "@/utils/TravelApprovalStages/hodApprovalStage";
import { hrApprovalStage } from "@/utils/TravelApprovalStages/hrApprovalStage";
import { directorApprovalStage } from "@/utils/TravelApprovalStages/directorApprovalStage";
import { EmailSender } from "@/services/EmailSender";

export type UpdateRequestStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  approverName: string;
  approverEmail: string;
};

export async function UpdateTravelStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {
  let client: PoolClient | undefined;

  // Our base update query and params
  const baseUpdateQuery = `
    UPDATE travel_requisitions
    SET travel_${payload.stage}_approval_date = CURRENT_TIMESTAMP,
    travel_${payload.stage}_approval_status = $1,
    travel_${payload.stage}_approver = $2,
    travel_${payload.stage}_email = $3,
    travel_${payload.stage}_comments = $4
    WHERE request_id = $5
    `;

  //  params
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
      `SELECT travel_${payload.stage}_approval_status AS approval_status,
       travel_${payload.stage}_approver AS approver,
       travel_approval_tier, submitter_email, travel_hod_email, travel_hr_email
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

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    const hodEmail = reviewedResult[0].travel_hod_email;
    const hrEmail = reviewedResult[0].travel_hr_email;
    const approvalTier = reviewedResult[0].travel_approval_tier;

    if (isReviewed !== "pending" && isReviewed !== "N/A") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${previousApprover}, no further action is required`,
      };
    }

    await client.query(baseUpdateQuery, baseParams);

    await client.query("COMMIT");

    switch (payload.stage) {
      case "hod":
        hodApprovalStage({
          uuid: payload.uuid,
          userEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
          approvalTier,
        });
        break;
      case "hr":
        hrApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
          approvalTier,
        });
        break;
      case "director":
        directorApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          hrEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
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
