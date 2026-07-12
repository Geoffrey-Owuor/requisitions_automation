"use client";
import ClientPortal from "../ClientPortal";

const CustomLoader = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M12 18a2 2 0 1 0 0 4a2 2 0 1 0 0-4m0-16a2 2 0 1 0 0 4a2 2 0 1 0 0-4M7.76 19.07c-.78.78-2.05.78-2.83 0s-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83M19.07 7.76c-.78.78-2.05.78-2.83 0s-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83M4 14c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2m16 0c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2M4.93 7.76c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83s-2.05.78-2.83 0m11.31 11.31c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0s.78 2.05 0 2.83s-2.05.78-2.83 0"
    ></path>
  </svg>
);

const LogoutOverlay = () => {
  return (
    <ClientPortal>
      <div className="fixed inset-0 z-9999 flex h-screen items-center justify-center bg-white">
        {/* Container to align the spinner and text horizontally */}
        <div className="flex items-center space-x-2">
          {/* The  Loader spinner */}
          <CustomLoader
            className="animate-spin text-neutral-900"
            aria-label="overlay text"
          />

          {/* The text, styled for dark and light modes */}
          <span className="text-base text-neutral-900">Logging out...</span>
        </div>
      </div>
    </ClientPortal>
  );
};

export default LogoutOverlay;
