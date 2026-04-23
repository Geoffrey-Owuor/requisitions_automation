"use client";

import Link from "next/link";
import { FileSearch, Circle, Home } from "lucide-react";

export default function NotFoundRequest() {
  return (
    <div className="reltive flex min-h-screen items-center justify-center p-5">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FileSearch className="h-7 w-7 text-[#7c5a5a]" />
        </div>

        {/* Label */}
        <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
          404 - Not Found
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          Request not found
        </h2>

        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a]">
          We couldn&apos;t locate the specific travel request you&apos;re
          looking for. It may have been deleted, withdrawn, or the reference
          link is incorrect.
        </p>

        {/* Possible reasons card */}
        <div className="mb-7 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-5 py-4 text-left">
          <p className="mb-2.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            Possible reasons
          </p>
          <ul className="flex flex-col gap-2">
            {[
              "The request ID in the URL is incorrect",
              "The request has been cancelled or archived",
              "You may not have the required permissions",
            ].map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-[13px] text-[#1e1b1b]"
              >
                <span className="mt-1 flex h-3 w-3 shrink-0 items-center justify-center">
                  <Circle className="h-1.5 w-1.5 fill-rose-500 text-rose-500" />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Action */}
        <Link
          href="/"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#1e1b1b] py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(30,27,27,0.3)]"
        >
          <Home size={16} />
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
