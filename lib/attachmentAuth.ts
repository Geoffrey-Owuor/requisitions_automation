import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isValidEmployeeStage } from "@/public/assets";

export type AttachmentRow = {
  original_filename: string;
  file_path: string;
  mime_type: string;
  submitter_email: string;
};

export type AttachmentAuthResult =
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; attachment: AttachmentRow };

// Shared by every route that serves an employee requisition attachment
// (raw file download/inline view, rendered preview) so the authorization
// rules stay in exactly one place.
export async function authorizeAttachmentRequest(
  request: NextRequest,
  attachmentId: string,
): Promise<AttachmentAuthResult> {
  const result = await query<AttachmentRow>(
    `
    SELECT a.original_filename, a.file_path, a.mime_type, r.submitter_email
    FROM employee_requisition_attachments a
    JOIN employee_requisitions r ON r.request_id = a.request_id
    WHERE a.attachment_id = $1
    `,
    [attachmentId],
  );

  if (result.length === 0) {
    return { status: "not_found" };
  }

  const attachment = result[0];

  const token = request.nextUrl.searchParams.get("token");
  const stage = request.nextUrl.searchParams.get("stage");

  let authorized = false;

  // Submitter branch: a valid session matching the requisition's submitter
  const session = await getSession();
  if (session && session.email === attachment.submitter_email) {
    authorized = true;
  }

  // Approver branch: any member of the relevant stage's approver array,
  // regardless of whether that stage is still pending - mirrors the
  // existing approver-page behaviour of not scoping access to only the
  // specific token that ends up acting on the request.
  if (!authorized && token && isValidEmployeeStage(stage)) {
    const approverResult = await query(
      `SELECT 1 FROM ${stage}_array WHERE ${stage}_uuid = $1`,
      [token],
    );
    if (approverResult.length > 0) {
      authorized = true;
    }
  }

  if (!authorized) {
    return { status: "forbidden" };
  }

  return { status: "ok", attachment };
}
