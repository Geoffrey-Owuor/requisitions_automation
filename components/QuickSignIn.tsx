// components/QuickSignIn.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { initialsHelper } from "@/public/assets";
import ClientPortal from "./ClientPortal";

type SavedUser = {
  name: string;
  email: string;
};

export default function QuickSignIn() {
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // NEW: Abort if the user has already handled the prompt in this browser session
    if (sessionStorage.getItem("Requisitions_Automation_quickSignInHandled"))
      return;

    // Check if we remember a user from a previous session
    const cachedUser = localStorage.getItem("Requisitions_Automation_lastUser");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed?.name && parsed?.email) {
          Promise.resolve().then(() => setSavedUser(parsed));
          // Small delay before popping up for a natural feel
          setTimeout(() => setIsVisible(true), 1000);
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  const handleDismiss = () => {
    // NEW: Mark as handled for this session
    sessionStorage.setItem(
      "Requisitions_Automation_quickSignInHandled",
      "true",
    );
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300); // Matches the animation duration
  };

  const handleContinue = () => {
    // Navigate directly to your API route to trigger the SSO flow
    window.location.href = "/api/auth/login";

    // Dismiss the component
    handleDismiss();
  };

  if (!isVisible && !isDismissing) return null;

  // Extract initials for the avatar
  const initials = initialsHelper(
    savedUser?.name ? savedUser.name : "Micro Soft",
  );

  return (
    <ClientPortal>
      <div
        className={`fixed top-3 right-4 left-auto z-9999 hidden w-full max-w-80 transition-all duration-300 md:block ${
          isDismissing ? "animate-slide-out-top" : "animate-slide-in-top"
        }`}
      >
        <div className="relative">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_2px_4px_rgba(140,40,60,0.03),0_24px_48px_-20px_rgba(140,40,60,0.4)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-white p-1 ring-1 ring-slate-100">
                  <MicrosoftIcon />
                </span>
                <span className="text-[13px] font-semibold text-slate-600">
                  Sign in to the Apps Hub
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                aria-label="Dismiss"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* User Profile Area */}
            <div className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-lg font-bold text-white shadow-sm ring-4 ring-rose-50">
                {initials}
              </div>
              <h3 className="truncate text-base font-semibold text-slate-900">
                {savedUser?.name}
              </h3>
              <p className="truncate text-sm text-slate-500">
                {savedUser?.email}
              </p>
            </div>

            {/* Action Button */}
            <div className="px-5 pt-2 pb-5">
              <button
                onClick={handleContinue}
                className="w-full cursor-pointer rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 active:scale-[0.98]"
              >
                Continue as {savedUser?.name.split(" ")[0]}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                To use a different account, close this window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}

function MicrosoftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
