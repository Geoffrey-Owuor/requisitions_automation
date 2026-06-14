"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import ClientPortal from "../ClientPortal";
import { getDailyGreeting } from "@/public/assets";

const DashboardAlert = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // React will only run this function
  // exactly once during the initial render, locking in the greeting.
  const [greeting] = useState(() => getDailyGreeting());

  // Handle the exit animation and unmounting
  const handleClose = () => {
    setIsExiting(true);
    // Wait for the slide-out animation to finish (400ms) before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  useEffect(() => {
    // Auto-close after 6 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(timer); // Cleanup if the component unmounts early
  }, []);

  // Completely unmount the component when it's no longer visible
  if (!isVisible) return null;

  return (
    <ClientPortal>
      <div
        className={`fixed top-4 left-1/2 z-9999 hidden items-center gap-3 rounded-full border border-white/10 bg-black/85 px-5 py-3 text-white shadow-2xl sm:flex ${isExiting ? "animate-slide-out-top" : "animate-slide-in-top"} `}
        role="alert"
      >
        {/* Notification Icon */}
        <div className="flex items-center justify-center rounded-full bg-white/20 p-1.5">
          <Bell className="h-4 w-4 text-white" />
        </div>

        {/* Greeting Text */}
        <p className="pr-2 text-sm font-medium tracking-wide">{greeting}</p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="rounded-full p-1 transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none"
          aria-label="Close alert"
        >
          <X className="h-4 w-4 text-gray-300 hover:text-white" />
        </button>
      </div>
    </ClientPortal>
  );
};

export default DashboardAlert;
