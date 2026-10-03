"use client";

import Link from "next/link";
import { UserX, Home } from "lucide-react";

// Shown on a HOD-stage approval link when the token holder isn't the
// assigned HOD or one of their alternates (or is the submitter) - see
// getHodPageAccess in lib/hodAssignment.ts.
export default function NotAssignedHod({ message }: { message: string }) {
  return (
    <div className="layout-scrollbar relative flex h-screen items-center justify-center overflow-y-auto p-5">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)]">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <UserX className="h-7 w-7 text-amber-600" />
        </div>

        {/* Label */}
        <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-amber-600 uppercase">
          Not Assigned
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          No Action Required
        </h2>

        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a]">
          {message}
        </p>

        {/* Action */}
        <Link
          href="/"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(30,27,27,0.3)]"
        >
          <Home size={16} />
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
