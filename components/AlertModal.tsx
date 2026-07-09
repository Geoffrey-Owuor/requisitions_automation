import { CheckCircle2, XCircle } from "lucide-react";
import { AlertInfo } from "./TravelRequisitionPage";

interface AlertModalProps {
  alertInfo: AlertInfo;
  setStep: (step: number) => void;
}

export default function AlertModal({ alertInfo, setStep }: AlertModalProps) {
  const isSuccess = alertInfo.alertType === "success";

  const config = {
    icon: isSuccess ? CheckCircle2 : XCircle,
    iconColor: isSuccess ? "text-emerald-500" : "text-rose-500",
    iconBg: isSuccess ? "bg-emerald-50" : "bg-rose-50",
    badge: isSuccess ? "Success" : "Error",
    badgeColor: isSuccess
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700",
    heading: isSuccess ? "Requisition submitted!" : "Submission failed",
    buttonLabel: isSuccess ? "Submit another" : "Try again",
    buttonStyle: isSuccess
      ? "bg-slate-900 text-white hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)]"
      : "bg-slate-900 text-white hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)]",
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

        {/* Button */}
        <button
          onClick={() => {
            setStep(1);
            const dashboardDiv = document.getElementById("modal-wrapper");
            dashboardDiv?.scrollTo({ top: 0, behavior: "instant" });
          }}
          className={`mt-8 mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none py-4 text-[14px] font-semibold transition-all duration-200 hover:-translate-y-0.5 ${config.buttonStyle}`}
        >
          {config.buttonLabel}
        </button>
      </div>
    </div>
  );
}
