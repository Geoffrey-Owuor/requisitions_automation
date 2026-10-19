"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Info, ChevronRight } from "lucide-react";
import { AdvanceRequestsSkeleton } from "../Skeletons/AdvanceRequestsSkeleton";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import {
  GetMyAdvanceRequests,
  MyAdvanceRequest,
} from "@/serverActions/PublicServerActions/GetMyAdvanceRequests";
import SalaryAdvanceRequestModal from "./SalaryAdvanceRequestModal";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Row counts per staff member are small (bounded by the active-request lock
// in SubmitAdvanceForm.ts), so this fetches once on mount and renders
// client-side — no server pagination needed, matching the sibling
// SalaryAdvanceAlterationSection.
export default function SalaryAdvanceHistorySection() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MyAdvanceRequest[]>([]);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<MyAdvanceRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const response = await GetMyAdvanceRequests();
      if (cancelled) return;

      if (response.type === "error") {
        setLoadError(response.message);
      } else {
        setLoadError("");
        setRequests(response.requests ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AdvanceRequestsSkeleton
        variant="history"
        label="Loading your request history..."
      />
    );
  }

  if (loadError) {
    return (
      <div className="rounded-surface border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {loadError}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-surface border border-slate-200 bg-white p-8 text-center">
        <div className="rounded-control mx-auto mb-4 flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-500">
          <Info size={20} />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900">
          You haven&apos;t submitted any salary advance requests yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
          Once you submit a request, it will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <button
          key={request.requestId}
          type="button"
          onClick={() => setSelected(request)}
          className="group rounded-surface flex w-full items-center justify-between gap-3 border border-slate-200 bg-white p-5 text-left transition-colors hover:bg-slate-50"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {request.requestType === "continuous" ? "Continuous" : "One-off"}{" "}
              advance &middot; KES{" "}
              {Number(request.requestAmount).toLocaleString()}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarClock size={13} />
              Repayment started {formatDate(request.repaymentStartDate)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusFormatter status={request.approvalStatus} />
            <ChevronRight
              size={16}
              className="text-slate-300 transition-colors group-hover:text-slate-500"
            />
          </div>
        </button>
      ))}

      <SalaryAdvanceRequestModal
        request={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
