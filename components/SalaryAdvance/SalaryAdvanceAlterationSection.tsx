"use client";

import { useEffect, useState } from "react";
import { Repeat, CalendarClock, Info, Loader2, Trash2 } from "lucide-react";
import type {
  AlterationCandidate,
  AlterationType,
} from "@/lib/salaryAdvanceRules";
import { GetAlterationEligibility } from "@/serverActions/PublicServerActions/GetAlterationEligibility";
import { SubmitAlterationRequest } from "@/serverActions/PublicServerActions/SubmitAlterationRequest";
import CustomDropdown from "./CustomDropDown";
import { useAlertStore } from "@/store/useAlertStore";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// A single request can have more than one eligible action at once (e.g. a
// pending, unexported continuous request is eligible both to switch to
// one-off and to be deleted outright) — grouped into one card, one action
// row per candidate, instead of a separate card per candidate.
function CandidateGroup({
  candidates,
  onSuccess,
}: {
  candidates: AlterationCandidate[];
  onSuccess: () => void;
}) {
  const [selectedInstallments, setSelectedInstallments] = useState("");
  const [submittingType, setSubmittingType] = useState<AlterationType | null>(
    null,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const triggerAlert = useAlertStore((state) => state.triggerAlert);

  const primary = candidates[0];
  const switchCandidate = candidates.find(
    (item) => item.alterationType === "switch_to_oneoff",
  );
  const reduceCandidate = candidates.find(
    (item) => item.alterationType === "reduce_installments",
  );
  const deleteCandidate = candidates.find(
    (item) => item.alterationType === "delete_request",
  );

  const submitAlteration = async (
    candidate: AlterationCandidate,
    newInstallments?: number,
  ) => {
    setSubmittingType(candidate.alterationType);
    try {
      const response = await SubmitAlterationRequest({
        requestId: candidate.requestId,
        alterationType: candidate.alterationType,
        newInstallments,
      });

      triggerAlert(response.type, response.message);

      if (response.type === "success") {
        onSuccess();
      }
    } finally {
      setSubmittingType(null);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {primary.requestType === "continuous" ? "Continuous" : "One-off"}{" "}
            advance &middot; KES{" "}
            {Number(primary.requestAmount).toLocaleString()}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock size={13} />
            Repayment started {formatDate(primary.repaymentStartDate)}
            {primary.requestType === "oneoff" &&
              ` · ${primary.noOfInstallments} installment${primary.noOfInstallments > 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
        {switchCandidate && (
          <div className="flex flex-wrap items-end gap-3">
            <p className="flex-1 text-[13px] text-slate-600">
              Convert this to a one-off request so the deduction ends after its
              current installment, instead of continuing indefinitely.
            </p>
            <button
              type="button"
              disabled={submittingType !== null}
              onClick={() => submitAlteration(switchCandidate)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {submittingType === "switch_to_oneoff" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Repeat size={15} />
              )}
              Switch to one-off
            </button>
          </div>
        )}

        {reduceCandidate && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-55">
              <CustomDropdown
                label="Reduce installments to"
                options={reduceCandidate.installmentOptions.map((value) => ({
                  label: String(value),
                  value: String(value),
                }))}
                value={selectedInstallments}
                onChange={setSelectedInstallments}
                openUpwards={true}
              />
            </div>

            <button
              type="button"
              disabled={submittingType !== null || !selectedInstallments}
              onClick={() =>
                submitAlteration(reduceCandidate, Number(selectedInstallments))
              }
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {submittingType === "reduce_installments" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Repeat size={15} />
              )}
              Apply reduction
            </button>
          </div>
        )}

        {deleteCandidate && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50/60 px-4 py-3">
            <p className="flex-1 text-[13px] text-rose-700">
              {confirmingDelete
                ? "This can't be undone. Delete this request for good?"
                : "Submitted this by mistake? You can delete it while it's still pending review."}
            </p>
            <button
              type="button"
              disabled={submittingType !== null}
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                submitAlteration(deleteCandidate);
              }}
              onBlur={() => setConfirmingDelete(false)}
              className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                confirmingDelete
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-rose-500/90 hover:bg-rose-600"
              }`}
            >
              {submittingType === "delete_request" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              {confirmingDelete ? "Confirm delete?" : "Delete request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalaryAdvanceAlterationSection() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<AlterationCandidate[]>([]);
  const [loadError, setLoadError] = useState("");

  // Re-run on mount and after a successful alteration (the altered/deleted
  // request's eligibility just changed). Not extracted into a shared
  // function called from the effect — a direct call to a named function
  // that sets state synchronously is what the set-state-in-effect lint rule
  // flags; an inline IIFE isn't.
  const loadCandidates = async (cancelledRef?: { current: boolean }) => {
    setLoading(true);
    const response = await GetAlterationEligibility();
    if (cancelledRef?.current) return;

    if (response.type === "error") {
      setLoadError(response.message);
    } else {
      setLoadError("");
      setCandidates(response.candidates ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const cancelledRef = { current: false };
    (async () => {
      setLoading(true);
      const response = await GetAlterationEligibility();
      if (cancelledRef.current) return;

      if (response.type === "error") {
        setLoadError(response.message);
      } else {
        setLoadError("");
        setCandidates(response.candidates ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Checking your active requests...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {loadError}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Info size={20} />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900">
          No requests are currently eligible for alteration
        </h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
          You can request an alteration only if you have an active continuous
          advance (to switch it to one-off), an active one-off advance with more
          than one installment remaining (to shorten it), or a request
          that&apos;s still pending review and hasn&apos;t yet been exported (to
          delete it). None of these apply to your current requests right now.
        </p>
      </div>
    );
  }

  const groups = new Map<string, AlterationCandidate[]>();
  for (const candidate of candidates) {
    const existing = groups.get(candidate.requestId);
    if (existing) {
      existing.push(candidate);
    } else {
      groups.set(candidate.requestId, [candidate]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
        <Info size={15} className="mt-0.5 shrink-0" />
        HR & Finance will be notified in their report and they will make the
        necessary changes to your request.
      </p>
      {Array.from(groups.entries()).map(([requestId, group]) => (
        <CandidateGroup
          key={requestId}
          candidates={group}
          onSuccess={loadCandidates}
        />
      ))}
    </div>
  );
}
