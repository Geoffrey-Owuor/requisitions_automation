"use client";

import Link from "next/link";
import { useIsSignedIn } from "@/context/UserContext";
import { Hourglass } from "lucide-react";

// An approval link opened for a stage the requisition hasn't reached - an
// earlier stage is still pending, or declined it
export default function StageNotReached({ stageLabel }: { stageLabel: string }) {
  const isSignedIn = useIsSignedIn();

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center p-5">
      <div className="rounded-surface mx-auto max-w-md border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)]">
        <div className="rounded-control mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-amber-100">
          <Hourglass className="h-7 w-7 text-amber-600" />
        </div>

        <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-amber-600 uppercase">
          Not ready for review
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          This requisition isn&apos;t at your stage yet
        </h2>

        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a] last:mb-0">
          It hasn&apos;t reached the {stageLabel} approval stage - an earlier
          stage is still pending or has declined it. You&apos;ll get an email
          if it needs your approval.
        </p>

        {/* Action - signed-in users already have the dashboard nav, and
            "/" would only redirect them back to /dashboard */}
        {!isSignedIn && (
          <Link
            href="/"
            className="rounded-control block w-full cursor-pointer bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(30,27,27,0.3)]"
          >
            Go to Homepage
          </Link>
        )}
      </div>
    </div>
  );
}
