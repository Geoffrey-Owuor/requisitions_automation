"use client";

import Link from "next/link";
import { Ban } from "lucide-react";

export default function PushbackUnavailable({ reason }: { reason: string }) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center p-5">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Ban className="h-7 w-7 text-amber-600" />
        </div>

        <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-amber-600 uppercase">
          Push-back unavailable
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          This requisition can&apos;t be pushed back
        </h2>

        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a]">
          {reason}
        </p>

        <Link
          href="/"
          className="block w-full cursor-pointer rounded-[14px] bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(30,27,27,0.3)]"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
