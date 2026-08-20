import { NextResponse, NextRequest } from "next/server";
import path from "path";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { readAttachmentFile } from "@/lib/attachmentStorage";
import { authorizeAttachmentRequest } from "@/lib/attachmentAuth";

const PREVIEW_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 16px; line-height: 1.5; color: #1e1b1b; }
  img { max-width: 100%; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #e2e2e2; padding: 4px 8px; font-size: 13px; }
`;

function unsupportedPreviewPage(): NextResponse {
  return new NextResponse(
    `<style>${PREVIEW_STYLES}</style><p>Preview isn't available for this file type. Use the Download button to view it.</p>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((run) => run.text).join("");
    }
    if ("result" in value) return String(value.result ?? "");
    if ("text" in value) return String(value.text);
  }
  return String(value);
}

function worksheetToHtml(worksheet: ExcelJS.Worksheet): string {
  const rows: string[] = [];
  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(`<td>${escapeHtml(cellText(cell))}</td>`);
    });
    rows.push(`<tr>${cells.join("")}</tr>`);
  });

  return `<style>${PREVIEW_STYLES}</style><table>${rows.join("")}</table>`;
}

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
  const extension = path.extname(attachment.original_filename).toLowerCase();

  // .doc and .xls are the legacy binary Office formats - neither mammoth
  // (docx only) nor exceljs (xlsx only) can parse them, and there's no
  // lightweight conversion path for them, so they fall back to download-only.
  if (extension !== ".docx" && extension !== ".xlsx") {
    return unsupportedPreviewPage();
  }

  const fileBuffer = await readAttachmentFile(attachment.file_path);

  if (extension === ".docx") {
    const { value: bodyHtml } = await mammoth.convertToHtml({
      buffer: fileBuffer,
    });
    const html = `<style>${PREVIEW_STYLES}</style>${bodyHtml}`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  // exceljs's Buffer param type and this @types/node's Buffer generic
  // disagree structurally (a type-declaration mismatch, not a runtime one -
  // a Buffer is a Buffer), so the strict generic check is bypassed here.
  await workbook.xlsx.load(
    fileBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return unsupportedPreviewPage();
  }

  return new NextResponse(worksheetToHtml(worksheet), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
