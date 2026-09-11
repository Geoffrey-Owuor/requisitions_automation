"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { hodApprovalStage } from "@/utils/CasualApprovalStages/hodApprovalStage";
import { hrApprovalStage } from "@/utils/CasualApprovalStages/hrApprovalStage";
import { CasualEmailSender } from "@/services/CasualEmailSender";
import { isValidCasualStage } from "@/public/assets";

export type UpdateRequestStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  approverName: string;
  approverEmail: string;
  // The amendment_count the approver's screen was rendered from - guards
  // against approving content that was superseded by an amendment while
  // this approver had the page open.
  expectedAmendmentCount: number;
};

export async function UpdateCasualStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {
  if (!isValidCasualStage(payload.stage)) {
    return {
      alertType: "error",
      alertMessage: "Invalid approval stage provided",
    };
  }

  let client: PoolClient | undefined;

  // Our base update query and params
  const baseUpdateQuery = `
    UPDATE casual_requisitions
    SET casual_${payload.stage}_approval_date = CURRENT_TIMESTAMP,
    casual_${payload.stage}_approval_status = $1,
    casual_${payload.stage}_approver = $2,
    casual_${payload.stage}_email = $3,
    casual_${payload.stage}_comments = $4
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
      `SELECT casual_${payload.stage}_approval_status AS approval_status,
       casual_${payload.stage}_approver AS approver,
       submitter_email, casual_hod_email, amendment_count
        FROM casual_requisitions WHERE request_id = $1 FOR UPDATE`,
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

    // Check if the approver exists in our table array data set. HR approvers
    // are additionally scoped to the forms in their hr_forms allow-list -
    // salary advance never reaches this check, it has its own approver.
    const isHrStage = payload.stage === "hr";
    const { rows: approverResult } = await client.query(
      isHrStage
        ? `SELECT id, hr_forms FROM hr_array WHERE hr_email = $1 FOR UPDATE`
        : `SELECT id FROM ${payload.stage}_array WHERE ${payload.stage}_email = $1 FOR UPDATE`,
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

    if (isHrStage && !approverResult[0].hr_forms.includes("casual")) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "You are not authorized to approve casual requisitions, please contact your admin for support",
      };
    }

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    const hodEmail = reviewedResult[0].casual_hod_email;

    if (reviewedResult[0].amendment_count !== payload.expectedAmendmentCount) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This requisition was amended while you were reviewing it - please reload and try again",
      };
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
      case "hr":
        hrApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      default:
        CasualEmailSender({
          to: process.env.ACCESS_EMAIL_SENDER!,
          requestId: payload.uuid,
          message:
            "A wrong stage was passed in the casual requisition approval workflow for this requistion",
          title: "Wrong stage passed to casual requisition approval workflow",
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
