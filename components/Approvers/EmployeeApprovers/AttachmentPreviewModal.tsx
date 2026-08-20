"use client";

import { useState } from "react";
import { X, Download, FileWarning } from "lucide-react";
import ClientPortal from "@/components/ClientPortal";

interface AttachmentPreviewModalProps {
  attachmentId: string;
  label: string;
  queryString?: string;
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
  onClose,
}: AttachmentPreviewModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const baseParams = new URLSearchParams(queryString);
  const searchSuffix = baseParams.toString() ? `?${baseParams.toString()}` : "";

  const rawUrl = `/api/employeerequisition/attachment/${attachmentId}${searchSuffix}`;
  const previewUrl = `/api/employeerequisition/attachment/${attachmentId}/preview${searchSuffix}`;

  const downloadParams = new URLSearchParams(queryString);
  downloadParams.set("download", "1");
  const downloadUrl = `/api/employeerequisition/attachment/${attachmentId}?${downloadParams.toString()}`;

  const extension = getExtension(label);
  const isPdf = extension === ".pdf";
  const isOfficePreviewable = extension === ".docx" || extension === ".xlsx";
  const iframeSrc = isPdf ? rawUrl : isOfficePreviewable ? previewUrl : null;

  return (
    <ClientPortal>
      <div
        onClick={onClose}
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="truncate pr-4 text-sm font-medium text-gray-800">
              {label}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={downloadUrl}
                download={label}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 bg-gray-50">
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
                  className="h-full w-full border-0 bg-white"
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <FileWarning className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Preview isn&apos;t available for this file type.
                </p>
                <p className="text-xs text-gray-400">
                  Use the Download button above to view it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
