"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 px-4">
      <div className="mx-auto max-w-md rounded-4xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
        {/* Icon with a subtle "searching" animation pulse */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
          <Search className="h-8 w-8 text-neutral-400" />
          <div className="absolute inset-0 animate-ping rounded-full bg-neutral-400/10" />
        </div>

        {/* Label */}
        <p className="mb-2 text-[12px] font-bold tracking-[1px] text-neutral-500 uppercase">
          Error 404
        </p>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#1e1b1b]">
          Lost in space?
        </h1>

        <p className="mb-8 text-[14px] leading-relaxed text-[#7c5a5a]">
          The page you are looking for doesn&apos;t seem to exist or has been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home size={18} />
            Return to Homepage
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-transparent py-4 text-[14px] font-semibold text-neutral-700 transition-all duration-200 hover:bg-neutral-50"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
