"use client";
import { useState } from "react";
import {
  X,
  UserRound,
  CheckCircle2,
  Check,
  Banknote,
  CircleDollarSign,
} from "lucide-react";
import { useAlertStore } from "@/store/useAlertStore";
import StatusFormatter from "../Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";
import ClientPortal from "@/components/ClientPortal";
import { SalaryAdvanceData } from "@/serverActions/GetSalaryAdvanceData";
import { ReviewSalaryAdvance } from "@/serverActions/ReviewSalaryAdvance";
import { useQueryClient } from "@tanstack/react-query";
import SubmittingOverlay from "../SubmittingOverlay";

interface SalaryAdvanceModalProps {
  isOpen: boolean;
  data: SalaryAdvanceData | null;
  onClose: () => void;
  onSuccess: () => void; // Trigger refetch on the table
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-400">
        <Icon size={14} />
      </div>
      <h3 className="text-[11px] font-bold tracking-widest text-red-400 uppercase">
        {title}
      </h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {label}
      </span>
      <span className="max-w-50 truncate text-sm text-[#1e1b1b]">
        {value || "—"}
      </span>
    </div>
  );
}

export function SalaryAdvanceModal({
  isOpen,
  data,
  onClose,
  onSuccess,
}: SalaryAdvanceModalProps) {
  const queryClient = useQueryClient();

  const [comments, setComments] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    "approved" | "declined" | null
  >(null);

  const triggerAlert = useAlertStore((state) => state.triggerAlert);

  if (!isOpen || !data) return null;

  const handleReview = async (status: "approved" | "declined") => {
    setLoadingAction(status);
    const result = await ReviewSalaryAdvance(data.request_id, status, comments);

    setLoadingAction(null);

    if (result.success) {
      setComments(""); // reset
      triggerAlert("success", result.message);

      // Invalidate card data
      queryClient.invalidateQueries({ queryKey: ["SalaryAdvancesCounts"] });
      onSuccess(); // refetch table data
      onClose(); // close modal
    } else {
      triggerAlert("error", result.message);
    }
  };

  const isPending = data.approval_status?.toLowerCase() === "pending";

  return (
    <ClientPortal>
      {loadingAction !== null && <SubmittingOverlay />}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-[20px] border border-b border-gray-200 bg-white/90 shadow-[0_32px_64px_rgba(60,100,160,0.15)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-[20px] border-b border-neutral-100/50 bg-neutral-50/40 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-400 shadow-sm">
                <CircleDollarSign size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e1b1b]">
                  Salary Advance Requisition
                </h2>
                <p className="text-[11px] text-gray-400">
                  {dateFormatter(data.request_created_at)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-neutral-200 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="layout-scrollbar max-h-[80vh] space-y-6 overflow-y-auto px-6 py-6">
            {/* — Employee Info — */}
            <section>
              <SectionHeader icon={UserRound} title="Employee Details" />
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <Field label="Staff Name" value={data.staff_name} />
                <Field label="Staff Number" value={data.staff_number} />
                <Field label="Email" value={data.staff_email} />
                <Field label="Department" value={data.staff_department} />
                <Field label="Location" value={data.staff_location} />
              </div>
            </section>

            {/* — Advance Details — */}
            <section>
              <SectionHeader icon={Banknote} title="Advance Details" />
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <Field
                  label="Request Amount"
                  value={`KES ${Number(data.request_amount).toLocaleString()}`}
                />
                <Field label="Installments" value={data.no_of_installments} />
                <Field
                  label="Repayment Start"
                  value={dateFormatter(data.repayment_start_date)}
                />
                <Field
                  label="Request Type"
                  value={
                    <span className="capitalize">{data.request_type}</span>
                  }
                />
              </div>
            </section>

            {/* — Approval Workflow / Review Area — */}
            <section>
              <SectionHeader icon={CheckCircle2} title="Approval Workflow" />
              <div className="rounded-2xl border border-gray-100 bg-white/60 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                    Current Status
                  </span>
                  <StatusFormatter status={data.approval_status} />
                </div>

                {isPending ? (
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                        Reviewer Comments
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your comments here (optional)..."
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-sm outline-hidden transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleReview("declined")}
                        disabled={loadingAction !== null}
                        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {loadingAction === "declined" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <X size={16} />
                        )}
                        Decline
                      </button>
                      <button
                        onClick={() => handleReview("approved")}
                        disabled={loadingAction !== null}
                        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-50"
                      >
                        {loadingAction === "approved" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Check size={16} />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-4">
                    <Field
                      label="Comments"
                      value={data.approver_comments || "No comments provided"}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
