import fs from "fs/promises";
import path from "path";
import { EmployeeAttachmentType } from "@/public/assets";

// Allowed attachment types for Employee Requisition position attachments
// (Job Description / KPI documents) — extension is the source of truth,
// the browser-supplied MIME type must also match one of the values below.
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string[]> = {
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".pdf": ["application/pdf"],
};

export const MAX_ATTACHMENT_BYTES_PER_FILE = 2 * 1024 * 1024; // 2MB

export function getUploadDirectory(): string {
  const uploadDir = process.env.UPLOAD_DIRECTORY;

  if (!uploadDir) {
    throw new Error("UPLOAD_DIRECTORY environment variable is not set");
  }

  return uploadDir;
}

// Strips path separators, traversal sequences, and control characters from
// a browser-supplied file name so it's safe to use as a path segment.
export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[/\\]/g, "");

  const cleaned = base
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/\.\./g, "")
    .trim();

  return cleaned || "attachment";
}

export function isAllowedAttachmentType(
  filename: string,
  mimeType: string,
): boolean {
  const extension = path.extname(filename).toLowerCase();
  const allowedMimeTypes = ALLOWED_ATTACHMENT_TYPES[extension];

  return !!allowedMimeTypes && allowedMimeTypes.includes(mimeType);
}

export type StoredAttachment = {
  originalFilename: string;
  storedFilename: string;
  filePath: string; // relative to UPLOAD_DIRECTORY
  mimeType: string;
  fileSizeBytes: number;
  attachmentType: EmployeeAttachmentType;
};

// Writes each typed file for a single position to
// UPLOAD_DIRECTORY/{requestId}/{positionId}/{attachmentType}/{sanitizedName}
export async function writePositionAttachments(
  requestId: string,
  positionId: string,
  files: Record<EmployeeAttachmentType, File>,
): Promise<StoredAttachment[]> {
  const stored: StoredAttachment[] = [];

  for (const [attachmentType, file] of Object.entries(files) as [
    EmployeeAttachmentType,
    File,
  ][]) {
    const typeDir = path.join(
      getUploadDirectory(),
      requestId,
      positionId,
      attachmentType,
    );
    await fs.mkdir(typeDir, { recursive: true });

    const storedFilename = sanitizeFilename(file.name);
    const absolutePath = path.join(typeDir, storedFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    stored.push({
      originalFilename: file.name,
      storedFilename,
      filePath: path.join(requestId, positionId, attachmentType, storedFilename),
      mimeType: file.type,
      fileSizeBytes: file.size,
      attachmentType,
    });
  }

  return stored;
}

// Removes the entire directory tree for a requisition (used to clean up
// partial writes when a submission fails after some files were saved).
export async function deleteRequisitionDirectory(
  requestId: string,
): Promise<void> {
  const requestDir = path.join(getUploadDirectory(), requestId);

  await fs.rm(requestDir, { recursive: true, force: true });
}

export async function readAttachmentFile(
  relativeFilePath: string,
): Promise<Buffer> {
  const absolutePath = path.join(getUploadDirectory(), relativeFilePath);

  return fs.readFile(absolutePath);
}
