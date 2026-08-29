"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";
import PageShell from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell width="narrow">
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="rounded-surface shadow-floating w-full border border-slate-200 bg-white p-6 text-center sm:p-7">
          <div className="ring-brand-50 bg-brand-50 text-brand-600 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ring-4">
            <Search className="h-5 w-5" />
          </div>

          <span className="border-brand-100 bg-brand-50 text-brand-700 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Error 404
          </span>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Page not found
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/"
              className="rounded-control bg-brand-600 hover:bg-brand-700 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Home size={15} />
              Return to homepage
            </Link>

            <button
              onClick={() => window.history.back()}
              className="rounded-control hover:border-brand-200 hover:text-brand-700 flex w-full cursor-pointer items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
            >
              <ArrowLeft size={15} />
              Go back
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
