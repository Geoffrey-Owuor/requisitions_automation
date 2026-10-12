"use client";

import { useState } from "react";
import { Download, FileWarning } from "lucide-react";
import { Modal } from "@/components/Modal";

interface AttachmentPreviewModalProps {
  attachmentId: string;
  label: string;
  queryString?: string;
  // Serve a file an amendment replaced/removed (see lib/attachmentAuth.ts)
  archived?: boolean;
  open: boolean;
  onClose: () => void;
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

export default function AttachmentPreviewModal({
  attachmentId,
  label,
  queryString,
  archived = false,
  open,
  onClose,
}: AttachmentPreviewModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const baseParams = new URLSearchParams(queryString);
  if (archived) baseParams.set("archived", "1");
  const searchSuffix = baseParams.toString() ? `?${baseParams.toString()}` : "";

  const rawUrl = `/api/employeerequisition/attachment/${attachmentId}${searchSuffix}`;
  const previewUrl = `/api/employeerequisition/attachment/${attachmentId}/preview${searchSuffix}`;

  const downloadParams = new URLSearchParams(baseParams);
  downloadParams.set("download", "1");
  const downloadUrl = `/api/employeerequisition/attachment/${attachmentId}?${downloadParams.toString()}`;

  const extension = getExtension(label);
  const isPdf = extension === ".pdf";
  const isOfficePreviewable = extension === ".docx" || extension === ".xlsx";
  const iframeSrc = isPdf ? rawUrl : isOfficePreviewable ? previewUrl : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      widthClassName="sm:max-w-4xl"
      bodyClassName="relative bg-gray-50 sm:h-[78dvh]"
      actions={
        <a
          href={downloadUrl}
          download={label}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 max-sm:flex-1 max-sm:py-2.5 max-sm:text-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      }
    >
      {iframeSrc ? (
        <>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              Loading preview...
            </div>
          )}
          <iframe
            src={iframeSrc}
            title={label}
            sandbox={isPdf ? undefined : ""}
            onLoad={() => setIframeLoaded(true)}
            className="relative block h-full w-full border-0 bg-white"
          />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <FileWarning className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            Preview isn&apos;t available for this file type.
          </p>
          <p className="text-xs text-gray-400">
            Use the Download button to view it.
          </p>
        </div>
      )}
    </Modal>
  );
}
