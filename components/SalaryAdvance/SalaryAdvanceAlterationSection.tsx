"use client";

import { useEffect, useState } from "react";
import { Repeat, CalendarClock, Info, Loader2 } from "lucide-react";
import type {
  AlterationCandidate,
  AlterationType,
} from "@/lib/salaryAdvanceRules";
import { GetAlterationEligibility } from "@/serverActions/PublicServerActions/GetAlterationEligibility";
import { SubmitAlterationRequest } from "@/serverActions/PublicServerActions/SubmitAlterationRequest";
import CustomDropdown from "./CustomDropDown";
import AlertModal from "../AlertModal";
import { AlertInfo } from "../TravelRequisitionPage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CandidateCard({
  candidate,
  onResult,
}: {
  candidate: AlterationCandidate;
  onResult: (result: AlertInfo) => void;
}) {
  const [selectedInstallments, setSelectedInstallments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSwitch = candidate.alterationType === "switch_to_oneoff";

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const input: {
        requestId: string;
        alterationType: AlterationType;
        newInstallments?: number;
      } = {
        requestId: candidate.requestId,
        alterationType: candidate.alterationType,
      };
      if (!isSwitch) {
        input.newInstallments = Number(selectedInstallments);
      }

      const response = await SubmitAlterationRequest(input);
      onResult({
        alertType: response.type,
        alertMessage: response.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {candidate.requestType === "continuous" ? "Continuous" : "One-off"}{" "}
            advance &middot; KES{" "}
            {Number(candidate.requestAmount).toLocaleString()}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock size={13} />
            Repayment started {formatDate(candidate.repaymentStartDate)}
            {candidate.requestType === "oneoff" &&
              ` · ${candidate.noOfInstallments} installment${candidate.noOfInstallments > 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        {isSwitch ? (
          <p className="flex-1 text-[13px] text-slate-600">
            Convert this to a one-off request so the deduction ends after its
            current installment, instead of continuing indefinitely.
          </p>
        ) : (
          <div className="w-full max-w-55">
            <CustomDropdown
              label="Reduce installments to"
              options={candidate.installmentOptions.map((value) => ({
                label: String(value),
                value: String(value),
              }))}
              value={selectedInstallments}
              onChange={setSelectedInstallments}
              openUpwards={true}
            />
          </div>
        )}

        <button
          type="button"
          disabled={submitting || (!isSwitch && !selectedInstallments)}
          onClick={handleSubmit}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Repeat size={15} />
          )}
          {isSwitch ? "Switch to one-off" : "Apply reduction"}
        </button>
      </div>
    </div>
  );
}

export default function SalaryAdvanceAlterationSection() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<AlterationCandidate[]>([]);
  const [loadError, setLoadError] = useState("");
  const [result, setResult] = useState<AlertInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const response = await GetAlterationEligibility();
      if (cancelled) return;

      if (response.type === "error") {
        setLoadError(response.message);
      } else {
        setCandidates(response.candidates ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (result) {
    return (
      <AlertModal
        alertInfo={result}
        onBack={() => setResult(null)}
        hideButton={result.alertType !== "success"}
        heading={{
          success: "Alteration applied",
          error: "Alteration failed",
        }}
        buttonLabel={{ success: "Done", error: "Try again" }}
      />
    );
  }

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
          advance (to switch it to one-off), or an active one-off advance with
          more than one installment remaining (to shorten it). Neither applies
          to your current requests right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-xl bg-slate-50 text-[13px] leading-relaxed text-slate-600">
        <Info size={15} className="mt-0.5 shrink-0" />
        HR & Finance will be notified in their report and they will make the
        necessary changes to your request.
      </p>
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.requestId}
          candidate={candidate}
          onResult={setResult}
        />
      ))}
    </div>
  );
}
