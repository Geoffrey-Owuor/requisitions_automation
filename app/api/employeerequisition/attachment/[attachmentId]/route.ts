import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isValidEmployeeStage } from "@/public/assets";
import { readAttachmentFile } from "@/lib/attachmentStorage";

type AttachmentRow = {
  original_filename: string;
  file_path: string;
  mime_type: string;
  submitter_email: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;

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
    return NextResponse.json(
      { message: "The requested attachment could not be found" },
      { status: 404 },
    );
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
    return NextResponse.json(
      { message: "You are not authorized to view this attachment" },
      { status: 403 },
    );
  }

  const fileBuffer = await readAttachmentFile(attachment.file_path);

  const asciiFallback = attachment.original_filename.replace(
    /[^\x20-\x7e]/g,
    "_",
  );
  const encodedName = encodeURIComponent(attachment.original_filename);

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  });
}
