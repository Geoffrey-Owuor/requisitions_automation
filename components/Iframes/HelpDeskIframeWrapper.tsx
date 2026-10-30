"use client";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// The HelpDesk app icon (issue-desk-embedded/app/icon0.svg), inlined so the
// loader shows it on first paint without a request.
const HelpDeskIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="helpdesk-icon-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#38a3f5" />
        <stop offset="1" stopColor="#0b4fc6" />
      </linearGradient>
    </defs>
    <rect
      width="512"
      height="512"
      rx="112"
      fill="url(#helpdesk-icon-gradient)"
    />
    <path
      fill="#ffffff"
      d="M176 120h160a72 72 0 0 1 72 72v104a72 72 0 0 1-72 72H246l-78 58a10 10 0 0 1-16-8v-50a72 72 0 0 1-48-68V192a72 72 0 0 1 72-72z"
    />
    <path
      fill="none"
      stroke="#0b4fc6"
      strokeWidth="40"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M190 247l46 46 88-92"
    />
  </svg>
);

const HelpDeskIframeWrapper = ({ ssoUrl }: { ssoUrl: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="relative h-full w-full bg-white dark:bg-neutral-950">
      {/* - LOADER OVERLAY - */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <HelpDeskIcon className="mb-12 h-30 w-30" />
          {/* Smaller Spinning Loader */}
          <Loader2 className="h-12 w-12 animate-spin text-neutral-500 dark:text-neutral-400" />

          {/* Footer at the bottom of the loader wrapper */}
          <div className="absolute right-0 bottom-6 left-0 px-4 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} Hotpoint Appliances Ltd. Internal Use
              Only
            </p>
          </div>
        </div>
      )}

      <iframe
        src={ssoUrl} // Reverse proxy login page
        title="Hotpoint HelpDesk"
        className={`h-full w-full border-none transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        allow="clipboard-read; clipboard-write"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default HelpDeskIframeWrapper;
