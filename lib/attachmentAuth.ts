import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { isValidEmployeeStage } from "@/public/assets";
import { canViewRequisition } from "@/lib/requisitionAccess";

export type AttachmentRow = {
  original_filename: string;
  file_path: string;
  mime_type: string;
  request_id: string;
};

export type AttachmentAuthResult =
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; attachment: AttachmentRow };

// Shared by every route that serves an employee requisition attachment
// (raw file download/inline view, rendered preview) so the authorization
// rules stay in exactly one place.
//
// With ?archived=1 the id is looked up among the files an amendment replaced
// or removed (employee_requisition_archived_attachments), under the same
// access rules. Without it only live attachments resolve, so a link to a
// replaced file in an earlier email stops working instead of quietly
// showing an outdated document.
export async function authorizeAttachmentRequest(
  request: NextRequest,
  attachmentId: string,
): Promise<AttachmentAuthResult> {
  // attachment_id and the approver token are uuid columns: Postgres throws on
  // malformed input rather than matching nothing.
  if (!isUuid(attachmentId)) return { status: "not_found" };

  const attachmentTable =
    request.nextUrl.searchParams.get("archived") === "1"
      ? "employee_requisition_archived_attachments"
      : "employee_requisition_attachments";

  const result = await query<AttachmentRow>(
    `
    SELECT a.original_filename, a.file_path, a.mime_type, a.request_id
    FROM ${attachmentTable} a
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

  // Approver branch: any member of the relevant stage's approver array,
  // regardless of whether that stage is still pending - mirrors the
  // existing approver-page behaviour of not scoping access to only the
  // specific token that ends up acting on the request.
  if (!authorized && isUuid(token) && isValidEmployeeStage(stage)) {
    const approverResult = await query(
      `SELECT 1 FROM ${stage}_array WHERE ${stage}_uuid = $1`,
      [token],
    );
    if (approverResult.length > 0) {
      authorized = true;
    }
  }

  // Session branch: anyone who may view this requisition — its submitter,
  // HOD, a later-stage approver it has reached, or analytics-employee
  // (lib/requisitionAccess.ts)
  if (!authorized) {
    const session = await getSession();
    if (session) {
      authorized = await canViewRequisition(
        "employee",
        attachment.request_id,
        session.email,
      );
    }
  }

  if (!authorized) {
    return { status: "forbidden" };
  }

  return { status: "ok", attachment };
}
