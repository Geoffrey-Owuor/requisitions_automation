"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import ClientPortal from "../ClientPortal";
import { getDailyGreeting } from "@/public/assets";

const DashboardAlert = () => {
  //  Check if the alert has already been shown in this session
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const hasShown = sessionStorage.getItem("dashboard_greeting_shown");
      return hasShown !== "true"; // Visible only if NOT shown yet
    }
    return false; // Default to false for SSR/Next.js hydration safety
  });

  const [isExiting, setIsExiting] = useState(false);
  const [greeting] = useState(() => getDailyGreeting());

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      // Mark as shown so it never triggers again this session
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dashboard_greeting_shown", "true");
      }
    }, 400);
  };

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  // If already shown in this session, render absolutely nothing
  if (!isVisible) return null;

  return (
    <ClientPortal>
      <div
        className={`fixed top-4 left-1/2 z-9999 hidden items-center gap-3 rounded-full border border-white/10 bg-black/85 px-5 py-3 text-white shadow-2xl sm:flex ${isExiting ? "animate-slide-out-top" : "animate-slide-in-top"} `}
        role="alert"
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
