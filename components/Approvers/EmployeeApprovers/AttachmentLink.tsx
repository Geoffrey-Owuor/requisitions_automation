"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

interface AttachmentLinkProps {
  attachmentId: string;
  label: string;
  queryString?: string;
  archived?: boolean;
  // Overrides the default chip styling (e.g. a struck-through old version)
  className?: string;
}

export default function AttachmentLink({
  attachmentId,
  label,
  queryString,
  archived = false,
  className,
}: AttachmentLinkProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Stays mounted after the first open so the close transition can play
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHasOpened(true);
          setIsPreviewOpen(true);
        }}
        className={
          className ??
          "flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(240,180,180,0.5)] bg-white/80 px-3 py-1.5 text-[12px] font-medium text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
        }
      >
        <Paperclip className="h-3.5 w-3.5" />
        <span className="max-w-40 truncate">{label}</span>
      </button>

      {hasOpened && (
        <AttachmentPreviewModal
          attachmentId={attachmentId}
          label={label}
          queryString={queryString}
          archived={archived}
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
