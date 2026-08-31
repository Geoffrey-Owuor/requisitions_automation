"use client";

import { X, BadgeCheck, AlertOctagon } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useAlertStore } from "@/store/useAlertStore";

const Alert = () => {
  // Alert store states
  const hideAlert = useAlertStore((state) => state.hideAlert);
  const showAlert = useAlertStore((state) => state.showAlert);
  const alertType = useAlertStore((state) => state.alertType);
  const alertMessage = useAlertStore((state) => state.alertMessage);

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      hideAlert();
      setIsClosing(false); // reset isClosing after it animates out
    }, 200); // Match this with your CSS animation duration
  }, [hideAlert]);

  // Auto close after 6 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAlert) {
      timer = setTimeout(handleClose, 6000);
    }
    return () => clearTimeout(timer);
  }, [showAlert, handleClose]);

  // Don't render anything if there's no alert and we aren't currently animating out
  if (!showAlert && !isClosing) return null;

  const isSuccess = alertType === "success";
  const IconComponent = isSuccess ? BadgeCheck : AlertOctagon;

  // Theming configurations specifically tailored for black (light) and white (dark) backgrounds
  const theme = {
    accentBar: isSuccess ? "bg-emerald-500" : "bg-rose-500",
    iconColor: isSuccess ? "text-emerald-400" : "text-rose-400",
    iconBg: isSuccess ? "bg-emerald-500/20" : "bg-rose-500/20",
    title: isSuccess ? "Success" : "Error",
  };

  return (
    // Container: Floating bottom right with responsive widths
    <div
      className={`fixed right-4 bottom-4 left-4 z-9999 transition-all duration-200 sm:right-6 sm:bottom-6 sm:left-auto sm:w-auto sm:max-w-md sm:min-w-[320px] ${
        isClosing
          ? "animate-slideDown opacity-0"
          : "animate-slideUp opacity-100"
      }`}
    >
      {/* Solid High-Contrast Card */}
      <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl bg-black p-4">
        {/* Left Accent Line */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-1.5 ${theme.accentBar}`}
        />

        {/* Icon Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBg}`}
        >
          <IconComponent className={`h-5 w-5 ${theme.iconColor}`} />
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col pt-0.5">
          {/* Title: White in light mode (on black), Black in dark mode (on white) */}
          <h3 className="text-sm font-bold tracking-tight text-white">
            {theme.title}
          </h3>
          {/* Message: Dimmed for contrast hierarchy */}
          <p
            className="mt-0.5 line-clamp-4 text-[13px] wrap-break-word text-neutral-200"
            title={alertMessage}
          >
            {alertMessage}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="shrink-0 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white active:scale-95"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default Alert;
