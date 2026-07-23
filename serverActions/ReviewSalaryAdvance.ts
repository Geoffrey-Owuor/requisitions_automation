"use server";
import { query } from "@/lib/db";

export async function ReviewSalaryAdvance(
  request_id: string,
  status: "approved" | "declined",
  comments: string,
) {
  try {
    // Default to "No comments" if left blank
    const finalComments = comments.trim() === "" ? "No comments" : comments;

    // Using parameterization to prevent SQL injection
    const updateQuery = `
      UPDATE salary_advances 
      SET approval_status = $1, approver_comments = $2
      WHERE request_id = $3
    `;

    await query(updateQuery, [status, finalComments, request_id]);

    return { success: true };
  } catch (error) {
    console.error("Error updating salary advance status:", error);
    return { success: false, error: "Failed to update requisition status." };
  }
}
