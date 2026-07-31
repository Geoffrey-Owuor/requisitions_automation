"use client";

import { useState } from "react";
import { X, Check, CircleDollarSign, TriangleAlert } from "lucide-react";
import ClientPortal from "@/components/ClientPortal";
import { useAlertStore } from "@/store/useAlertStore";
import { useQueryClient } from "@tanstack/react-query";
import { BatchReviewSalaryAdvance } from "@/serverActions/BatchReviewSalaryAdvance";

const DEFAULT_COMMENTS: Record<"approved" | "declined", string> = {
  approved: "Your request has been approved.",
  declined: "Your request has been declined.",
};

interface SalaryAdvanceBatchModalProps {
  isOpen: boolean;
  status: "approved" | "declined" | null;
  requestIds: string[];
  onClose: () => void;
  onSuccess: () => void; // Trigger refetch and clear selection on the table
}

export function SalaryAdvanceBatchModal({
  isOpen,
  status,
  requestIds,
  onClose,
  onSuccess,
}: SalaryAdvanceBatchModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerAlert = useAlertStore((state) => state.triggerAlert);

  if (!isOpen || !status) return null;

  const isApproving = status === "approved";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const result = await BatchReviewSalaryAdvance(requestIds, status);
    setIsSubmitting(false);

    if (result.success) {
      triggerAlert("success", result.message);

      // Invalidate card data
      queryClient.invalidateQueries({ queryKey: ["SalaryAdvancesCounts"] });
      onSuccess();
      onClose();
    } else {
      triggerAlert("error", result.message);
    }
  };

  return (
    <ClientPortal>
      <div
        onClick={isSubmitting ? undefined : onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isApproving
                    ? "bg-slate-100 text-slate-800"
                    : "bg-red-50 text-red-500"
                }`}
              >
                <CircleDollarSign size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Batch {isApproving ? "Approve" : "Decline"}
                </h2>
                <p className="text-xs text-gray-600">
                  {requestIds.length} request
                  {requestIds.length === 1 ? "" : "s"} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-6">
            <p className="text-sm text-gray-600">
              You are about to mark{" "}
              <span className="font-semibold text-gray-900">
                {requestIds.length} pending salary advance request
                {requestIds.length === 1 ? "" : "s"}
              </span>{" "}
              as <span className="font-semibold">{status}</span>. Each affected
              employee will be notified by email.
            </p>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                Comment to be sent
              </span>
              <p className="mt-1 text-sm text-gray-700">
                {DEFAULT_COMMENTS[status]}
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700">
                Emails are sent gradually (a few seconds apart) to avoid
                provider rate limits. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isApproving
                  ? "bg-slate-800 hover:bg-slate-900"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check size={16} />
              )}
              {isSubmitting
                ? "Processing..."
                : `Confirm ${isApproving ? "Approval" : "Decline"}`}
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
