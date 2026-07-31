"use server";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";
import { getSession } from "@/lib/session";

// Microsoft Graph throttles at ~3 simultaneous sends, so emails are staggered
const EMAIL_SEND_DELAY_MS = 3000;

const DEFAULT_COMMENTS: Record<"approved" | "declined", string> = {
  approved: "Your request has been approved.",
  declined: "Your request has been declined.",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatchEmails(
  recipients: { requestId: string; staffEmail: string }[],
  status: "approved" | "declined",
) {
  for (let i = 0; i < recipients.length; i++) {
    if (i > 0) await delay(EMAIL_SEND_DELAY_MS);

    const { requestId, staffEmail } = recipients[i];
    try {
      await AdvanceEmailSender({
        to: staffEmail,
        requestId,
        message: `Your salary advance request has been ${status} by HR. For more inquiry, contact HR`,
        title: `Salary Advance ${status} by HR`,
      });
    } catch (error) {
      console.error(
        `Failed to send batch advance email for request ${requestId}:`,
        error,
      );
    }
  }
}

export async function BatchReviewSalaryAdvance(
  requestIds: string[],
  status: "approved" | "declined",
) {
  const user = await getSession();
  if (!user)
    return { success: false, message: "Failed to authenticate the user" };

  if (!requestIds || requestIds.length === 0)
    return { success: false, message: "No requests were selected" };

  const finalComments = DEFAULT_COMMENTS[status];

  let client: PoolClient | undefined;
  const updated: { requestId: string; staffEmail: string }[] = [];

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Only rows still pending get reviewed - guards against double-processing
    // if another HR user already actioned a selected row
    for (const requestId of requestIds) {
      const { rows } = await client.query(
        `
        UPDATE salary_advances
        SET approval_status = $1, approver_comments = $2
        WHERE request_id = $3 AND approval_status = 'pending'
        RETURNING staff_email
        `,
        [status, finalComments, requestId],
      );

      if (rows.length > 0) {
        updated.push({ requestId, staffEmail: rows[0].staff_email });
      }
    }

    await client.query("COMMIT");

    if (updated.length === 0) {
      return {
        success: false,
        message:
          "None of the selected requests could be reviewed. They may have already been processed.",
      };
    }

    // Fire and forget - stagger sends to stay under the Graph throttle limit
    sendBatchEmails(updated, status);

    const skipped = requestIds.length - updated.length;

    return {
      success: true,
      message: `${updated.length} request${updated.length === 1 ? "" : "s"} ${status} successfully${
        skipped > 0 ? `, ${skipped} skipped (already reviewed)` : ""
      }`,
    };
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error("Error batch updating salary advance status:", error);
    return { success: false, message: "Failed to process batch review." };
  } finally {
    if (client) client.release();
  }
}
