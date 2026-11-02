"use client";

import { X, BadgeCheck, AlertOctagon } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { AlertItem, useAlertStore } from "@/store/useAlertStore";

const Alert = ({ alert }: { alert: AlertItem }) => {
  const dismissAlert = useAlertStore((state) => state.dismissAlert);
  const { id, type: alertType, message: alertMessage, count } = alert;

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => dismissAlert(id), 200); // Match this with your CSS animation duration
  }, [dismissAlert, id]);

  // Auto close after 6 seconds
  useEffect(() => {
    const timer = setTimeout(handleClose, 6000);
    return () => clearTimeout(timer);
  }, [handleClose]);

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
    // Positioned by AlertLayer, which also keeps it above any open modal
    <div
      className={`pointer-events-auto transition-all duration-200 ${
        isClosing
          ? "animate-slideDown opacity-0"
          : "animate-slideUp opacity-100"
      }`}
    >
      {/* Solid High-Contrast Card */}
      <div className="rounded-surface relative flex items-start gap-3 overflow-hidden bg-black p-4">
        {/* Left Accent Line */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-1.5 ${theme.accentBar}`}
        />

        {/* Icon Avatar */}
        <div
          className={`rounded-control flex h-10 w-10 shrink-0 items-center justify-center ${theme.iconBg}`}
        >
          <IconComponent className={`h-5 w-5 ${theme.iconColor}`} />
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col pt-0.5">
          {/* Title: White in light mode (on black), Black in dark mode (on white) */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-white">
              {theme.title}
            </h3>
            {count > 1 && (
              <span
                aria-label={`Shown ${count} times`}
                className="rounded-full bg-white/15 px-1.5 py-px text-[11px] leading-4 font-semibold text-white tabular-nums"
              >
                x{count}
              </span>
            )}
          </div>
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
          className="rounded-compact shrink-0 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white active:scale-95"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// Every alert on screen, each with its own timer, the newest nearest the corner
const Alerts = () => {
  const alerts = useAlertStore((state) => state.alerts);

  return alerts.map((alert) => <Alert key={alert.id} alert={alert} />);
};

export default Alerts;
