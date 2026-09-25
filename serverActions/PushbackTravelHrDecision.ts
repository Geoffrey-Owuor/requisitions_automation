"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import {
  getTravelPushbackBlocker,
  MAX_PUSHBACK_REASON_LENGTH,
  PUSHBACK_WINDOW_SQL,
} from "@/lib/travelPushback";
import { hrPushbackStage } from "@/utils/TravelApprovalStages/hrPushbackStage";

export type PushbackTravelHrDecisionProps = {
  uuid: string;
  token: string;
  status: string;
  comments: string;
  reason: string;
  // travel_hr_pushback_count the page was rendered with - rejects the
  // push-back if another HR member changed the decision in the meantime.
  expectedPushbackCount: number;
};

/**
 * Reverses the recorded HR decision on a travel requisition in a single
 * transaction: the previous decision is copied into travel_hr_pushbacks and
 * the travel_hr_* columns are overwritten. There is never an intermediate
 * "pending" state. Every rule is re-checked here - the approval page's
 * mode=pushback parameter is presentation only.
 */
export async function PushbackTravelHrDecision(
  payload: PushbackTravelHrDecisionProps,
): Promise<AlertInfo> {
  const reason = (payload.reason ?? "").trim();
  const comments = (payload.comments ?? "").trim() || "No comments";

  if (payload.status !== "approved" && payload.status !== "declined") {
    return { alertType: "error", alertMessage: "Invalid decision provided" };
  }
  if (!reason) {
    return {
      alertType: "error",
      alertMessage: "A push-back reason is required",
    };
  }
  if (reason.length > MAX_PUSHBACK_REASON_LENGTH) {
    return {
      alertType: "error",
      alertMessage: `The push-back reason cannot exceed ${MAX_PUSHBACK_REASON_LENGTH} characters`,
    };
  }

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // The acting approver is resolved from the HR token, never from
    // client-supplied name/email.
    const { rows: approverRows } = await client.query(
      `SELECT hr_name AS name, hr_email AS email, hr_forms
       FROM hr_array WHERE hr_uuid = $1`,
      [payload.token],
    );

    if (
      approverRows.length === 0 ||
      !approverRows[0].hr_forms.includes("travel")
    ) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "You are not authorized to push back travel requisitions, please contact your admin for support",
      };
    }

    const approverName: string = approverRows[0].name;
    const approverEmail: string = approverRows[0].email;

    const { rows } = await client.query(
      `SELECT travel_hod_approval_status, travel_hr_approval_status,
        travel_hr_approver, travel_hr_email, travel_hr_comments,
        travel_hr_approval_date, travel_approval_tier,
        travel_hr_pushback_count, submitter_email, travel_hod_email,
        ${PUSHBACK_WINDOW_SQL} AS within_window
       FROM travel_requisitions WHERE request_id = $1 FOR UPDATE`,
      [payload.uuid],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "The selected requisition could not be found, please contact your admin for support",
      };
    }

    const requisition = rows[0];
    const currentCount = Number(requisition.travel_hr_pushback_count);

    if (currentCount !== Number(payload.expectedPushbackCount)) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This requisition's HR decision was changed by someone else while you were reviewing it. Please reopen it and try again",
      };
    }

    const blocker = getTravelPushbackBlocker({
      hrStatus: requisition.travel_hr_approval_status,
      approvalTier: requisition.travel_approval_tier,
      pushbackCount: currentCount,
      withinWindow: requisition.within_window,
    });

    if (blocker) {
      await client.query("ROLLBACK");
      return { alertType: "error", alertMessage: blocker };
    }

    const previousStatus: string = requisition.travel_hr_approval_status;

    if (payload.status === previousStatus) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition is already ${previousStatus} - a push-back must change the HR decision`,
      };
    }

    const pushbackNumber = currentCount + 1;

    await client.query(
      `INSERT INTO travel_hr_pushbacks (
        request_id, pushback_number, pushed_by_name, pushed_by_email,
        pushback_reason, previous_status, previous_approver, previous_email,
        previous_comments, previous_date, new_status, new_comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        payload.uuid,
        pushbackNumber,
        approverName,
        approverEmail,
        reason,
        previousStatus,
        requisition.travel_hr_approver,
        requisition.travel_hr_email,
        requisition.travel_hr_comments,
        requisition.travel_hr_approval_date,
        payload.status,
        comments,
      ],
    );

    await client.query(
      `UPDATE travel_requisitions
       SET travel_hr_approval_status = $1,
       travel_hr_approver = $2,
       travel_hr_email = $3,
       travel_hr_comments = $4,
       travel_hr_approval_date = CURRENT_TIMESTAMP,
       travel_hr_pushback_count = $5
       WHERE request_id = $6`,
      [
        payload.status,
        approverName,
        approverEmail,
        comments,
        pushbackNumber,
        payload.uuid,
      ],
    );

    await client.query("COMMIT");

    hrPushbackStage({
      uuid: payload.uuid,
      userEmail: requisition.submitter_email,
      hodEmail: requisition.travel_hod_email,
      previousStatus,
      status: payload.status,
      reason,
      approverEmail,
      approverName,
    });

    return {
      alertType: "success",
      alertMessage:
        "The HR decision on this requisition has been pushed back successfully, you may now safely close this window",
    };
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error(
      "Error while trying to push back the HR decision on this requisition",
      error,
    );
    return {
      alertType: "error",
      alertMessage:
        "An error occured while trying to push back the HR decision on this requisition",
    };
  } finally {
    if (client) client.release();
  }
}
