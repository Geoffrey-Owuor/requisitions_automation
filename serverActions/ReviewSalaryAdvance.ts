"use server";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";
import { getSession } from "@/lib/session";

export async function ReviewSalaryAdvance(
  request_id: string,
  status: "approved" | "declined",
  comments: string,
) {
  const user = await getSession();
  if (!user)
    return { success: false, message: "Failed to authenticate the user" };

  let client: PoolClient | undefined;

  try {
    // Get a pool client
    client = await pool.connect();

    await client.query("BEGIN");

    const { rows: existingRequest } = await client.query(
      `
        SELECT staff_email, approval_status FROM salary_advances
        WHERE request_id = $1
        `,
      [request_id],
    );

    if (existingRequest.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Selected salary advance request not found",
      };
    }

    // Get the returned data
    const staffEmail = existingRequest[0].staff_email;
    const approvalStatus = existingRequest[0].approval_status;

    // Request was already processed
    if (approvalStatus !== "pending") {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "This salary advance request has already been reviewed",
      };
    }
    // Default to "No comments" if left blank
    const finalComments = comments.trim() === "" ? "No comments" : comments;

    // Using parameterization to prevent SQL injection
    const updateQuery = `
      UPDATE salary_advances 
      SET approval_status = $1, approver_comments = $2
      WHERE request_id = $3
    `;

    await client.query(updateQuery, [status, finalComments, request_id]);

    await client.query("COMMIT");

    // Fire and forget - send status update email
    AdvanceEmailSender({
      to: staffEmail,
      requestId: request_id,
      message: `Your salary advance request has been ${status} by HR. For more inquiry, contact HR`,
      title: `Salary Advance ${status} by HR`,
    });

    return {
      success: true,
      message: "Salary advance request reviewed successfully",
    };
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error("Error updating salary advance status:", error);
    return { success: false, message: "Failed to update requisition status." };
  } finally {
    if (client) client.release();
  }
}
