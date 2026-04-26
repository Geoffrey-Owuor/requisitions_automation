import { CheckCircle2, XCircle } from "lucide-react";
import { AlertInfo } from "@/components/TravelRequisitionPage";

export default function ApprovalAlert(alertInfo: AlertInfo) {
  const isSuccess = alertInfo.alertType === "success";

  const config = {
    icon: isSuccess ? CheckCircle2 : XCircle,
    iconColor: isSuccess ? "text-emerald-500" : "text-rose-500",
    iconBg: isSuccess ? "bg-emerald-50" : "bg-rose-50",
    badge: isSuccess ? "Success" : "Error",
    badgeColor: isSuccess
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700",
    heading: isSuccess ? "Review Successful!" : "Review Failed!",
  };

  const Icon = config.icon;

  return (
    <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-5 py-10">
      <div className="w-full rounded-3xl border border-gray-100 bg-white/65 p-10 text-center shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
        {/* Icon */}
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconBg}`}
        >
          <Icon size={32} className={config.iconColor} />
        </div>

        {/* Badge */}
        <span
          className={`inline-block rounded-lg px-3 py-1 text-[11px] font-semibold tracking-[0.5px] uppercase ${config.badgeColor}`}
        >
          {config.badge}
        </span>

        {/* Heading */}
        <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          {config.heading}
        </h2>

        {/* Message */}
        <p className="mt-2 text-[13px] leading-relaxed text-[#7c5a5a]">
          {alertInfo.alertMessage}
        </p>

        {/* Parting message */}
        <p className="mt-4 text-xs text-neutral-600">
          You can safely close this window
        </p>
      </div>
    </div>
  );
}
