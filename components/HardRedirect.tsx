// components/HardRedirect.tsx
"use client";

import { useEffect } from "react";

const CustomLoader = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width={50}
    height={50}
    viewBox="0 0 24 24"
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path d="M3 12a9 9 0 0 0 9 9a9 9 0 0 0 9-9a9 9 0 0 0-9-9"></path>
      <path d="M17 12a5 5 0 1 0-5 5"></path>
    </g>
  </svg>
);
export default function HardRedirect({ url }: { url: string }) {
  useEffect(() => {
    // .replace() is better than .href here because it doesn't leave
    // a broken "redirect loop" entry in the user's browser back history
    // Capture the path and any search params (e.g., /dashboard/somepage?id=123)
    const currentPath = window.location.pathname + window.location.search;

    // Safely encode it to pass as a query parameter
    const targetUrl = `${url}?returnTo=${encodeURIComponent(currentPath)}`;
    window.location.replace(targetUrl);
  }, [url]);

  // Render a seamless loading state while the browser executes the redirect
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Main Centered Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <CustomLoader />
        <p className="text-sm font-semibold text-neutral-500">
          Just a moment...
        </p>
      </div>

      {/* Footer */}
      <div className="w-full px-4 pb-8 text-center">
        <p className="text-[13px] text-slate-500">
          &copy; {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal
          Use Only
        </p>
      </div>
    </div>
  );
}
