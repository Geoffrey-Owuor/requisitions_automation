"use client";
import { X, CalendarClock, History } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import ClientPortal from "../ClientPortal";
import { MyAdvanceRequest } from "@/serverActions/PublicServerActions/GetMyAdvanceRequests";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const ALTERATION_LABELS: Record<string, string> = {
  switch_to_oneoff: "Switched to one-off",
  reduce_installments: "Installments reduced",
  delete_request: "Deleted",
};

export default function SalaryAdvanceRequestModal({
  request,
  onClose,
}: {
  request: MyAdvanceRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;

  return (
    <ClientPortal>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-[20px] border border-white/80 bg-white/95 shadow-[0_32px_64px_rgba(160,60,60,0.15)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-2 rounded-t-[20px] bg-white px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1e1b1b]">
                {request.requestType === "continuous"
                  ? "Continuous"
                  : "One-off"}{" "}
                Advance
              </h2>
              <p className="text-[11px] text-neutral-500">
                Submitted {formatDate(request.requestCreatedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="layout-scrollbar max-h-[75vh] space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Amount
                </p>
                <p className="text-sm font-semibold text-[#1e1b1b]">
                  KES {Number(request.requestAmount).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Status
                </p>
                <StatusFormatter status={request.approvalStatus} />
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Installments
                </p>
                <p className="text-sm font-semibold text-[#1e1b1b]">
                  {request.noOfInstallments}
                  {request.requestType === "oneoff" &&
                    ` (${Math.max(request.remainingInstallments, 0)} remaining)`}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Repayment Started
                </p>
                <p className="flex items-center gap-1 text-sm font-semibold text-[#1e1b1b]">
                  <CalendarClock size={13} className="text-slate-400" />
                  {formatDate(request.repaymentStartDate)}
                </p>
              </div>
            </div>

            {request.approverComments && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Approver Comments
                </p>
                <p className="mt-1 text-sm text-[#1e1b1b]">
                  {request.approverComments}
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              {request.exported
                ? "Included in a monthly HR/Finance export."
                : "Not yet included in a monthly HR/Finance export."}
            </p>

            {request.alterations.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-tighter text-slate-500 uppercase">
                  <History size={13} />
                  Alteration History
                </div>
                <div className="space-y-2">
                  {request.alterations.map((alteration, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700"
                    >
                      <p className="font-medium text-[#1e1b1b]">
                        {ALTERATION_LABELS[alteration.alterationType] ??
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
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
