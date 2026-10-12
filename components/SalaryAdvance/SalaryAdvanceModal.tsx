"use client";
import { useState } from "react";
import {
  X,
  UserRound,
  CheckCircle2,
  Check,
  Banknote,
  CircleDollarSign,
  History,
} from "lucide-react";
import { useAlertStore } from "@/store/useAlertStore";
import StatusFormatter from "../Dashboard/StatusFormatter";
import {
  ALTERATION_TYPE_LABELS,
  dateFormatter,
  formatPhoneForDisplay,
} from "@/public/assets";
import { Modal } from "@/components/Modal";
import { SalaryAdvanceData } from "@/serverActions/GetSalaryAdvanceData";
import { FlagBadge } from "./FlagBadge";
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

  if (!data) return null;

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

  // No closing while a review is being saved
  const handleClose = () => {
    if (loadingAction === null) onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      icon={<CircleDollarSign size={18} className="text-red-400" />}
      title="Salary Advance Requisition"
      subtitle={dateFormatter(data.request_created_at)}
      bodyClassName="space-y-6 p-5 sm:p-6"
    >
      {loadingAction !== null && <SubmittingOverlay />}
      {/* — Employee Info — */}
      <section>
        <SectionHeader icon={UserRound} title="Employee Details" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field label="Staff Name" value={data.staff_name} />
          <Field label="Staff Number" value={data.staff_number} />
          <Field label="Email" value={data.staff_email} />
          <Field label="Department" value={data.staff_department} />
          <Field label="Location" value={data.staff_location} />
          <Field
            label="Phone Number"
            value={formatPhoneForDisplay(
              data.staff_phone_number,
              data.no_of_installments,
            )}
          />
        </div>
      </section>

      {/* — Advance Details — */}
      <section>
        <SectionHeader icon={Banknote} title="Advance Details" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
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
            value={<span className="capitalize">{data.request_type}</span>}
          />
          <Field
            label="Exported"
            value={
              <FlagBadge
                value={data.exported}
                trueLabel="Exported"
                falseLabel="Pending"
              />
            }
          />
          <Field
            label="Altered"
            value={
              <FlagBadge
                value={data.altered}
                trueLabel="Altered"
                falseLabel="—"
                tone="violet"
              />
            }
          />
        </div>
        {!data.exported && (
          <p className="mt-3 text-[11px] text-gray-400">
            Not yet included in an HR/Finance export — the staff member can
            still delete or alter this request without an audit trail.
          </p>
        )}
      </section>

      {/* — Alteration History — */}
      {data.alterations.length > 0 && (
        <section>
          <SectionHeader icon={History} title="Alteration History" />
          <div className="space-y-2 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
            {data.alterations.map((alteration, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[#1e1b1b]">
                    {ALTERATION_TYPE_LABELS[alteration.alterationType] ??
                      alteration.alterationType}
                  </p>
                  <FlagBadge
                    value={alteration.exported}
                    trueLabel="Exported"
                    falseLabel="Pending"
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {dateFormatter(alteration.createdAt)}
                  {alteration.previousInstallments != null &&
                    alteration.newInstallments != null &&
                    ` · ${alteration.previousInstallments} → ${alteration.newInstallments} installments`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* — Approval Workflow / Review Area — */}
      <section>
        <SectionHeader icon={CheckCircle2} title="Approval Workflow" />
        <div className="rounded-2xl border border-gray-100 bg-neutral-50 p-4">
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
    </Modal>
  );
}
