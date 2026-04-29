"use client";

import Link from "next/link";
import { ShieldAlert, Circle, Home } from "lucide-react";

export default function InvalidToken() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-5">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
        </div>

        {/* Label */}
        <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-amber-600 uppercase">
          Access Denied
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          Link no longer valid
        </h2>

        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a]">
          For security purposes, this approval link has either expired, been
          modified, or was already used. You&apos;ll need a fresh token to
          proceed.
        </p>

        {/* Hint card */}
        <div className="mb-7 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-5 py-4 text-left">
          <p className="mb-2.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            What you can do
          </p>
          <ul className="flex flex-col gap-2">
            {[
              "Ask the requester to generate a new link",
              "Check your inbox for a more recent email",
              "Ensure the URL was not truncated in your browser",
            ].map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2 text-[13px] text-[#1e1b1b]"
              >
                <span className="mt-1 flex h-3 w-3 shrink-0 items-center justify-center">
                  <Circle className="h-1.5 w-1.5 fill-rose-500 text-rose-500" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

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
