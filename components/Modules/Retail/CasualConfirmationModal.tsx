"use client";

import { ArrowLeft, Send } from "lucide-react";
import { CasualFormData } from "./CasualRequisitionForm";
import { dateFormatter } from "@/public/assets";
import { useUser } from "@/context/UserContext";
import { initialsHelper } from "@/public/assets";

interface SectionDerived {
  engagementDays: number;
  totalAmount: number;
}

interface CasualConfirmationModalProps {
  formData: CasualFormData;
  ratePerDay: number;
  sectionDerived: SectionDerived[];
  overallTotalAmount: number;
  overallTotalCasuals: number;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}

export default function CasualConfirmationModal({
  formData,
  ratePerDay,
  sectionDerived,
  overallTotalAmount,
  overallTotalCasuals,
  onBack,
  onSubmit,
  submitting,
}: CasualConfirmationModalProps) {
  const { username: userName, email: userEmail } = useUser();

  const nameString = userName ? userName : "";

  const requisitionDetails: { label: string; value: string }[] = [
    { label: "Department", value: formData.department },
    { label: "HOD Approver", value: formData.hodApprover },
    { label: "Location", value: formData.location },
    ...(formData.casualCategory
      ? [{ label: "Casual Category", value: formData.casualCategory }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
          Step 2 of 2
        </p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.3px] text-[#1e1b1b]">
          Review & confirm
        </h2>
        <p className="mt-1 text-[13px] text-[#7c5a5a]">
          Please review your Casual requisition before submitting.
        </p>
      </div>

      {/* User account card */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[13px] font-semibold text-rose-700">
          {initialsHelper(nameString)}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#1e1b1b]">{userName}</p>
          <p className="text-[12px] text-[#a18080]">{userEmail}</p>
        </div>
        <span className="ml-auto rounded-lg bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
          Requestor
        </span>
      </div>

      {/* Requisition Details */}
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Requisition Details
        </p>
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          {requisitionDetails.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-2 text-[13px]">
              <span className="text-[#7c5a5a]">{label}</span>
              <span className="font-medium text-[#1e1b1b]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-5">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Sections
        </p>
        <div className="flex flex-col gap-4">
          {formData.sections.map((section, index) => {
            const derived = sectionDerived[index];
            return (
              <div
                key={section.sectionName}
                className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 p-5"
              >
                <h3 className="mb-3 text-[13px] font-semibold text-[#1e1b1b]">
                  {section.sectionName}
                </h3>

                <div className="mb-3 grid grid-cols-2 gap-3 text-[13px] max-sm:grid-cols-1">
                  <div className="flex flex-col gap-2">
                    <span className="text-[#7c5a5a]">Number of Casuals</span>
                    <span className="font-medium text-[#1e1b1b]">
                      {section.numberOfCasuals}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[#7c5a5a]">Period</span>
                    <span className="font-medium text-[#1e1b1b]">
                      {section.periodFrom
                        ? dateFormatter(section.periodFrom)
                        : "—"}{" "}
                      -{" "}
                      {section.periodTo ? dateFormatter(section.periodTo) : "—"}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="mb-1 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                    Justification
                  </p>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#1e1b1b]">
                    {section.justification || "No justification provided"}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="mb-1 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                    PPEs Required
                  </p>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#1e1b1b]">
                    {section.ppesRequired || "No PPEs specified"}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-linear-to-r from-slate-800 to-rose-900 px-4 py-3 text-white">
                  <span className="text-[12px]">
                    {section.numberOfCasuals} casual(s) &times; KES{" "}
                    {ratePerDay.toLocaleString()}/day &times;{" "}
                    {derived?.engagementDays ?? 0} day(s)
                  </span>
                  <span className="text-[15px] font-semibold">
                    KES {(derived?.totalAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-5">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Overall Summary
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
            <span>Total Casuals</span>
            <span className="text-xl">{overallTotalCasuals}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-5 font-semibold text-white shadow-lg">
            <span>Total (KES)</span>
            <span className="text-xl">
              KES {overallTotalAmount.toLocaleString()}
            </span>
          </div>
        </div>
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
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit request"}
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
