import { NextResponse, NextRequest } from "next/server";
import { readAttachmentFile } from "@/lib/attachmentStorage";
import { authorizeAttachmentRequest } from "@/lib/attachmentAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;

  const result = await authorizeAttachmentRequest(request, attachmentId);

  if (result.status === "not_found") {
    return NextResponse.json(
      { message: "The requested attachment could not be found" },
      { status: 404 },
    );
  }

  if (result.status === "forbidden") {
    return NextResponse.json(
      { message: "You are not authorized to view this attachment" },
      { status: 403 },
    );
  }

  const { attachment } = result;

  const fileBuffer = await readAttachmentFile(attachment.file_path);

  const asciiFallback = attachment.original_filename.replace(
    /[^\x20-\x7e]/g,
    "_",
  );
  const encodedName = encodeURIComponent(attachment.original_filename);

  // ?download=1 forces a Save As instead of the default in-browser (PDF) view
  const disposition = request.nextUrl.searchParams.get("download")
    ? "attachment"
    : "inline";

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  });
}
