"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
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
        className={`fixed top-2 right-4 z-100 hidden items-center gap-3 rounded-full bg-neutral-900 px-5 py-3 text-white shadow-2xl sm:flex ${isExiting ? "animate-slide-out-top" : "animate-slide-in-top"} `}
      >
        <div className="flex items-center justify-center rounded-full bg-white/20 p-1.5">
          <Bell className="h-4 w-4 text-white" />
        </div>
        <p className="pr-2 text-sm font-medium tracking-wide">{greeting}</p>
        <button
          onClick={handleClose}
          className="rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4 text-gray-300 hover:text-white" />
        </button>
      </div>
    </ClientPortal>
  );
};

export default DashboardAlert;
