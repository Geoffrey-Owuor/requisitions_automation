"use client";

import { ArrowLeft, Send } from "lucide-react";
import { dateFormatter } from "@/public/assets";
import { initialsHelper } from "@/public/assets";
import { usePathname } from "next/navigation";
import { SalaryAdvanceFormData } from "./SalaryAdvanceClient"; // Adjust import path as needed

interface SalaryAdvanceConfirmationModalProps {
  formData: SalaryAdvanceFormData;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}

export default function SalaryAdvanceConfirmationModal({
  formData,
  onBack,
  onSubmit,
  submitting,
}: SalaryAdvanceConfirmationModalProps) {
  const pathname = usePathname();
  const employeeDetails: { label: string; value: string }[] = [
    { label: "Staff Name", value: formData.staffName },
    { label: "Staff Number", value: formData.staffNumber },
    { label: "Staff Email", value: formData.staffEmail },
    { label: "Department", value: formData.department },
    { label: "Location", value: formData.location || "N/A" },
  ];

  const advanceDetails: { label: string; value: string }[] = [
    { label: "Request Amount", value: formData.requestAmount },
    { label: "Installments", value: formData.installments },
    { label: "Start Date", value: formData.repaymentStartDate },
    {
      label: "Request Type",
      value: formData.requestType === "continuous" ? "Continuous" : "One-off",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
          Step {pathname === "/advance" ? "3" : "2"} of 3
        </p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          Review & Confirm
        </h2>
        <p className="mt-1 text-[13px] text-[#7c5a5a]">
          Please review your salary advance details before submitting.
        </p>
      </div>

      {/* User account card */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[13px] font-semibold text-rose-700">
          {initialsHelper(formData.staffName)}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#1e1b1b]">
            {formData.staffName}
          </p>
          <p className="text-[12px] text-[#a18080]">{formData.staffEmail}</p>
        </div>
        <span className="ml-auto rounded-lg bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
          Requestor
        </span>
      </div>

      {/* Details grid */}
      <div className="mb-6 grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        {/* Employee Details */}
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            Employee Details
          </p>
          <div className="flex flex-col gap-1.5">
            {employeeDetails.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[13px]">
                <span className="text-[#7c5a5a]">{label}</span>
                <span className="font-medium text-[#1e1b1b]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advance Details */}
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            Advance Details
          </p>
          <div className="flex flex-col gap-1.5">
            {advanceDetails.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[13px]">
                <span className="text-[#7c5a5a]">{label}</span>
                <span className="font-medium text-[#1e1b1b]">
                  {label === "Start Date" && value
                    ? dateFormatter(value)
                    : label === "Request Amount" && value
                      ? Number(value).toLocaleString() // Formats the number with commas
                      : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Policy Agreement Confirmation (Read-only status) */}
      <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-5">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Policy Agreement
        </p>
        <span className="inline-flex items-center gap-2 rounded-xl bg-white/60 py-3 text-[13px] leading-relaxed text-[#1e1b1b]">
          You have acknowledged and agreed to comply with the Salary Advance
          Policy, adhering strictly to the one-third (1/3) rule and repayment
          schedules.
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-[rgba(240,180,180,0.6)] bg-transparent px-6 py-4 text-[14px] font-semibold text-[#1e1b1b] transition-all duration-200 hover:bg-white/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit request"}
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
