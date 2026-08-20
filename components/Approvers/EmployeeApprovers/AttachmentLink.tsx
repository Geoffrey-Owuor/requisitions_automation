"use client";

import { Paperclip } from "lucide-react";

interface AttachmentLinkProps {
  url: string;
  label: string;
}

export default function AttachmentLink({ url, label }: AttachmentLinkProps) {
  const openAttachment = () => {
    window.open(
      url,
      "_blank",
      "width=900,height=700,noopener,noreferrer",
    );
  };

  return (
    <button
      type="button"
      onClick={openAttachment}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(240,180,180,0.5)] bg-white/80 px-3 py-1.5 text-[12px] font-medium text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
    >
      <Paperclip className="h-3.5 w-3.5" />
      <span className="max-w-40 truncate">{label}</span>
    </button>
  );
}
