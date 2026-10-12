"use client";
import { CalendarClock, History } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { Modal, useLastDefined } from "../Modal";
import { MyAdvanceRequest } from "@/serverActions/PublicServerActions/GetMyAdvanceRequests";
import { ALTERATION_TYPE_LABELS } from "@/public/assets";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SalaryAdvanceRequestModal({
  request,
  onClose,
}: {
  request: MyAdvanceRequest | null;
  onClose: () => void;
}) {
  // The parent clears `request` on close; keep it for the exit transition
  const shown = useLastDefined(request);
  if (!shown) return null;

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={`${shown.requestType === "continuous" ? "Continuous" : "One-off"} Advance`}
      subtitle={`Submitted ${formatDate(shown.requestCreatedAt)}`}
      widthClassName="sm:max-w-lg"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Amount
          </p>
          <p className="text-sm font-semibold text-[#1e1b1b]">
            KES {Number(shown.requestAmount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Status
          </p>
          <StatusFormatter status={shown.approvalStatus} />
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Installments
          </p>
          <p className="text-sm font-semibold text-[#1e1b1b]">
            {shown.noOfInstallments}
            {shown.requestType === "oneoff" &&
              ` (${Math.max(shown.remainingInstallments, 0)} remaining)`}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Repayment Started
          </p>
          <p className="flex items-center gap-1 text-sm font-semibold text-[#1e1b1b]">
            <CalendarClock size={13} className="text-slate-400" />
            {formatDate(shown.repaymentStartDate)}
          </p>
        </div>
        {/* Only multi-installment requests collect a phone number. */}
        {shown.phoneNumber && (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Phone Number
            </p>
            <p className="text-sm font-semibold text-[#1e1b1b]">
              {shown.phoneNumber}
            </p>
          </div>
        )}
      </div>

      {shown.approverComments && (
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Approver Comments
          </p>
          <p className="mt-1 text-sm text-[#1e1b1b]">
            {shown.approverComments}
          </p>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        {shown.approvalStatus !== "pending"
          ? "Reviewed by HR - no further export needed."
          : shown.exported
            ? "Included in a monthly HR/Finance export."
            : "Not yet included in a monthly HR/Finance export."}
      </p>

      {shown.alterations.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-tighter text-slate-500 uppercase">
            <History size={13} />
            Alteration History
          </div>
          <div className="space-y-2">
            {shown.alterations.map((alteration, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700"
              >
                <p className="font-medium text-[#1e1b1b]">
                  {ALTERATION_TYPE_LABELS[alteration.alterationType] ??
                    alteration.alterationType}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatDate(alteration.createdAt)}
                  {alteration.previousInstallments != null &&
                    alteration.newInstallments != null &&
                    ` · ${alteration.previousInstallments} → ${alteration.newInstallments} installments`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
