"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

interface AlreadyProcessedProps {
  processedAt?: string;
  processedBy?: string;
  status?: string;
}

export default function AlreadyProcessed({
  processedAt = "23 Apr 2026 at 10:45 AM",
  processedBy = "Finance HOD",
  status = "approved",
}: AlreadyProcessedProps) {
  // Logic to determine if the status is positive
  const isApproved = status === "approved" || status === "accepted";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-5">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
        {/* Icon */}
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            isApproved ? "bg-emerald-100" : "bg-rose-100"
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          ) : (
            <XCircle className="h-7 w-7 text-rose-600" />
          )}
        </div>

        {/* Label */}
        <p
          className={`mb-1 text-[11px] font-semibold tracking-[0.5px] uppercase ${
            isApproved ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          Already {status}
        </p>

        <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          Request already processed
        </h2>
        <p className="mb-7 text-[13px] leading-relaxed text-[#7c5a5a]">
          This request has already been reviewed and a decision was recorded. No
          further action is needed from you.
        </p>

        {/* Meta card */}
        <div className="mb-7 flex flex-col gap-2.5 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-5 py-4 text-left">
          {[
            { label: "Decision", value: status },
            { label: "Processed by", value: processedBy },
            { label: "Processed at", value: processedAt },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-[13px]">
              <span className="text-[#7c5a5a]">{label}</span>
              <span
                className={`font-medium capitalize ${
                  label === "Decision"
                    ? isApproved
                      ? "text-emerald-700"
                      : "text-rose-700"
                    : "text-[#1e1b1b]"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Action */}
        <Link
          href="/"
          className="block w-full cursor-pointer rounded-[14px] bg-[#1e1b1b] py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(30,27,27,0.3)]"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
