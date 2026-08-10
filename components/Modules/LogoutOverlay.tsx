"use client";

import ClientPortal from "../ClientPortal";

const CustomLoader = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M12 18a2 2 0 1 0 0 4a2 2 0 1 0 0-4M12 2a2 2 0 1 0 0 4a2 2 0 1 0 0-4M7.76 19.07c-.78.78-2.05.78-2.83 0s-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83M19.07 7.76c-.78.78-2.05.78-2.83 0s-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83M4 14c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2m16 0c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2M4.93 7.76c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83s-2.05.78-2.83 0m11.31 11.31c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83s-2.05.78-2.83 0"
    />
  </svg>
);

const LogoutOverlay = () => {
  return (
    <ClientPortal>
      <div
        className="animate-in fade-in fixed inset-0 z-9999 flex items-center justify-center bg-white backdrop-blur-sm duration-200"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="w-full max-w-sm px-10 py-8">
          <div className="flex flex-col items-center text-center">
            {/* Loader */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full">
              <CustomLoader className="h-16 w-16 animate-spin text-rose-600" />
            </div>

            {/* Heading */}
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
              Signing you out
            </h2>

            {/* Supporting text */}
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ending your secure session...
            </p>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
};

export default LogoutOverlay;
