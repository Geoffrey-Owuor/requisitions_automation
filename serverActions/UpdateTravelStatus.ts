"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";

type UpdateTravelStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  approverName: string;
  approverEmail: string;
};

export async function UpdateTravelStatus(
  payload: UpdateTravelStatusProps,
): Promise<AlertInfo> {
  let client: PoolClient | undefined;

  // Our base update query and params
  const baseUpdateQuery = `
    UPDATE travel_requisitions
    SET travel_${payload.stage}_approval_status = $1,
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
       travel_${payload.stage}_approver AS approver
        FROM travel_requisitions WHERE request_id = $1 FOR UPDATE`,
      [payload.uuid],
    );

    const isReviewed = reviewedResult[0].approval_status;
    const approver = reviewedResult[0].approver;

    if (isReviewed !== "pending" && isReviewed !== "N/A") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${approver}, no further action is required`,
      };
    }

    await client.query(baseUpdateQuery, baseParams);

    await client.query("COMMIT");

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
