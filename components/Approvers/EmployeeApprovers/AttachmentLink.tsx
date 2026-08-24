"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

interface AttachmentLinkProps {
  attachmentId: string;
  label: string;
  queryString?: string;
}

export default function AttachmentLink({
  attachmentId,
  label,
  queryString,
}: AttachmentLinkProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(240,180,180,0.5)] bg-white/80 px-3 py-1.5 text-[12px] font-medium text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
      >
        <Paperclip className="h-3.5 w-3.5" />
        <span className="max-w-40 truncate">{label}</span>
      </button>

      {isPreviewOpen && (
        <AttachmentPreviewModal
          attachmentId={attachmentId}
          label={label}
          queryString={queryString}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
