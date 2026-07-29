"use client";
import { ArrowLeft, Send, Wrench } from "lucide-react";
import { TravelFormData } from "./TravelRequisitionPage";
import { dateFormatter, initialsHelper } from "@/public/assets";
import { useUser } from "@/context/UserContext";

interface ConfirmationModalProps {
  formData: TravelFormData;
  totalCost: number;
  approvalTier: string;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  totalEngineeringAmount: number;
}

export default function TravelConfirmationModal({
  formData,
  totalCost,
  approvalTier,
  onBack,
  onSubmit,
  submitting,
  totalEngineeringAmount,
}: ConfirmationModalProps) {
  const { username: userName, email: userEmail } = useUser();
  const nameString = userName ? userName : "";

  const sections: { label: string; value: string }[][] = [
    [
      { label: "Name", value: formData.employeeName },
      { label: "Department", value: formData.department },
      { label: "Designation", value: formData.designation },
      { label: "HOD Approver", value: formData.hodApprover },
      { label: "Cost Centre", value: formData.costCentre },
    ],
    [
      { label: "Destination", value: formData.destination },
      { label: "Departure", value: dateFormatter(formData.departureDate) },
      { label: "Return", value: dateFormatter(formData.returnDate) },
      { label: "Category", value: formData.travelCategory },
      { label: "Travel Mode", value: formData.travelMode },
      { label: "Within Budget?", value: formData.withinBudget },
    ],
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
          Please review your travel request before submitting.
        </p>
      </div>

      {/* User account card */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
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

      {/* Details grid */}
      <div className="mb-5 grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            Employee Details
          </p>
          <div className="flex flex-col gap-1.5">
            {sections[0].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[13px]">
                <span className="text-[#7c5a5a]">{label}</span>
                <span className="font-medium text-[#1e1b1b]">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            Trip Information
          </p>
          <div className="flex flex-col gap-1.5">
            {sections[1].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[13px]">
                <span className="text-[#7c5a5a]">{label}</span>
                <span className="font-medium text-[#1e1b1b]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Justification */}
      <div className="mb-5 border-t border-[rgba(240,180,180,0.4)] pt-5">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Business Justification
        </p>
        <p className="rounded-xl bg-white/60 py-3 text-[13px] leading-relaxed text-[#1e1b1b]">
          {formData.justification}
        </p>
      </div>

      {/* Cost breakdown */}
      <div className="mb-5 border-t border-[rgba(240,180,180,0.4)] pt-5">
        {/* --- NEW: Engineering Jobs Breakdown --- */}
        {formData.department === "Engineering & HVAC" &&
          formData.engineeringJobs && (
            <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <span className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.4px] text-rose-800 uppercase">
                <Wrench className="h-3.5 w-3.5" />
                Engineering Job Allocations
              </span>
              <div className="flex flex-col gap-2.5">
                {formData.engineeringJobs.map((job, idx) => (
                  <div
                    key={job.id || idx}
                    className="flex items-center justify-between border-b border-rose-100/50 pb-2 text-[13px] last:border-0 last:pb-0"
                  >
                    <span className="font-medium text-[#7c5a5a]">
                      {job.title || "Unnamed Job"}
                    </span>
                    <span className="font-semibold text-[#1e1b1b]">
                      KES {Number(job.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Engineering Subtotal Placeholder */}
              <div className="mt-3 flex items-center justify-between border-t border-rose-200/80 pt-3">
                <span className="text-[14px] font-semibold tracking-wide text-rose-700">
                  Allocations Subtotal
                </span>
                <span className="text-[15px] font-bold text-rose-900">
                  KES {totalEngineeringAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Cost Breakdown (KES)
        </p>
        <div className="mb-3 grid grid-cols-3 gap-2 max-sm:grid-cols-2">
          {[
            { label: "Transport", value: formData.transportCost },
            { label: "Others", value: formData.otherCost },
            { label: "Per Diem", value: formData.perDiem },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-100 px-3 py-2.5 text-center"
            >
              <p className="text-[11px] text-[#7c5a5a]">{label}</p>
              <p className="mt-0.5 text-[15px] font-semibold text-[#1e1b1b]">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-4 text-white">
            <span className="text-[13px] text-white/70">Total</span>
            <span className="text-[16px] font-semibold">
              KES {totalCost.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-rose-900/80 px-5 py-4 text-rose-50">
            <span className="text-[13px] text-rose-200">Approval Tier</span>
            <span className="text-[16px] font-semibold">{approvalTier}</span>
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
