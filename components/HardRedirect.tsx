"use client";

import { useEffect } from "react";
import Image from "next/image";
import { assets } from "@/public/assets";

const CustomLoader = () => (
  <div className="relative flex h-20 w-20 items-center justify-center">
    <div className="absolute inset-0 rounded-full bg-rose-100/70" />

    <svg
      className="relative h-11 w-11 animate-spin text-rose-600"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-15"
      />

      <path
        d="M21 12A9 9 0 0 0 12 3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default function HardRedirect({
  url,
  returnTo,
}: {
  url: string;
  returnTo?: string;
}) {
  useEffect(() => {
    const currentPath =
      returnTo ?? window.location.pathname + window.location.search;

    window.location.replace(
      `${url}?returnTo=${encodeURIComponent(currentPath)}`,
    );
  }, [url, returnTo]);

  return (
    <main className="flex min-h-screen flex-col bg-linear-to-b from-rose-50 via-white to-white">
      <div className="flex flex-1 items-center justify-center px-6">
        <div
          className="rounded-surface w-full max-w-md border border-rose-100 bg-white px-10 py-10 shadow-xl shadow-rose-100/30"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-100 bg-linear-to-br from-white to-rose-50 shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_10px_24px_-10px_rgba(225,29,72,0.45)]">
              <div className="absolute inset-0 rounded-full ring-8 ring-rose-50/60" />

              <div className="relative h-7 w-7">
                <Image
                  src={assets.hotpoint_logo}
                  alt="Hotpoint Apps Hub"
                  fill
                  priority
                  sizes="32px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <CustomLoader />

            <h1 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">
              Redirecting...
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please wait while we securely redirect you to the requested
              application.
            </p>

            <div className="mt-8 h-1.5 w-36 overflow-hidden rounded-full bg-rose-100">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal Use
          Only
        </p>
      </footer>
    </main>
  );
}
