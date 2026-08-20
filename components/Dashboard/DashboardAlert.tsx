"use client";

import { useState, useEffect } from "react";
import { SmileIcon, X } from "lucide-react";
import ClientPortal from "../ClientPortal";
import { getDailyGreeting } from "@/public/assets";

const DashboardAlert = () => {
  // Check if it has been shown in this session
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const hasShown = sessionStorage.getItem("dashboard_greeting_shown");
      return hasShown !== "true";
    }
    return false; // Default to false for SSR/Next.js hydration safety
  });

  // 1. Add a state to control the actual slide-in trigger
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting] = useState(() => getDailyGreeting());

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dashboard_greeting_shown", "true");
      }
    }, 400);
  };

  useEffect(() => {
    if (!isVisible) return;

    // 2. Wait 1 second before showing the alert
    const entryTimer = setTimeout(() => {
      setShouldRender(true);
    }, 1000);

    // 3. Keep the alert open for 6 seconds AFTER it renders (1000ms delay + 6000ms open time = 7000ms total)
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 7000);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [isVisible]);

  // If already shown in this session, or we are still waiting out the 1s delay, render nothing
  if (!isVisible || !shouldRender) return null;

  return (
    <ClientPortal>
      <div
        className={`fixed right-6 bottom-6 z-100 hidden w-88 max-w-[calc(100vw-3rem)] items-start gap-3 rounded-2xl border border-white/10 bg-neutral-900/95 p-4 text-white shadow-2xl backdrop-blur-md sm:flex ${isExiting ? "animate-slide-out-bottom-right" : "animate-slide-in-bottom-right"} `}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-400/25 to-orange-500/25">
          <SmileIcon className="h-5 w-5 text-amber-300" />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
            Hey there
          </p>
          <p className="mt-0.5 text-sm leading-snug font-medium tracking-wide text-white">
            {greeting}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </ClientPortal>
  );
};

export default DashboardAlert;
