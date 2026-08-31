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
    // Abort if the user has already handled the prompt in this browser session
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
    // Mark as handled for this session
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
      {/* Anchored to the top on every breakpoint: full width inside the gutters
          on small screens, a fixed-width card from md up. It stays top-aligned
          so the existing slide-from-top animation reads correctly at both. */}
      <div
        className={`fixed top-3 right-3 left-3 z-9999 transition-all duration-300 md:left-auto md:w-80 ${
          isDismissing ? "animate-slide-out-top" : "animate-slide-in-top"
        }`}
      >
        <div className="rounded-surface shadow-floating overflow-hidden border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <MicrosoftIcon />
              <span className="text-sm font-semibold text-slate-600">
                Sign in to the Apps Hub
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-control hover:bg-brand-50 hover:text-brand-700 cursor-pointer p-1.5 text-slate-400 transition-colors"
              aria-label="Dismiss"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-4 text-center">
            <div className="bg-brand-600 ring-brand-50 mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white ring-4">
              {initials}
            </div>
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {savedUser?.name}
            </h3>
            <p className="truncate text-sm text-slate-500">
              {savedUser?.email}
            </p>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={handleContinue}
              className="rounded-control bg-brand-600 hover:bg-brand-700 w-full cursor-pointer px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Continue as {savedUser?.name.split(" ")[0]}
            </button>
            <p className="mt-2.5 text-center text-xs text-slate-400">
              To use a different account, close this window.
            </p>
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
