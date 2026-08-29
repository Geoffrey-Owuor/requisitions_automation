"use client";

import { useEffect, useState } from "react";

const LoginWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sign-in navigates away, so this component is normally torn down while
    // pending. Coming back via the browser's back button can restore it from
    // the bfcache with `isLoading` still true, which would leave the button
    // permanently disabled — reset it when the page is shown again.
    const reset = () => setIsLoading(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form
      action="/api/auth/login"
      method="GET"
      className="w-full"
      onSubmit={() => setIsLoading(true)}
    >
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="rounded-control hover:border-brand-200 hover:bg-brand-50/60 focus-visible:outline-brand-600 flex w-full cursor-pointer items-center justify-center gap-2.5 border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-90"
      >
        <MicrosoftIcon />

        {/* Both labels occupy the same grid cell, so the button keeps its width
            when the text swaps — no hardcoded width to keep in sync with copy. */}
        <span className="grid">
          <span
            className={`col-start-1 row-start-1 ${isLoading ? "invisible" : ""}`}
          >
            Sign in with Microsoft 365
          </span>
          <span
            className={`text-brand-900 col-start-1 row-start-1 flex items-center justify-center gap-1.5 ${
              isLoading ? "" : "invisible"
            }`}
          >
            Getting things ready
            <span className="flex items-center gap-0.5 pt-0.5">
              <span className="chase-dot h-1.5 w-1.5 rounded-full [animation-delay:-0.4s]" />
              <span className="chase-dot h-1.5 w-1.5 rounded-full [animation-delay:-0.2s]" />
              <span className="chase-dot h-1.5 w-1.5 rounded-full" />
            </span>
          </span>
        </span>
      </button>

      <span aria-live="polite" className="sr-only">
        {isLoading ? "Redirecting to Microsoft sign in" : ""}
      </span>
    </form>
  );
};

export default LoginWrapper;

function MicrosoftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
