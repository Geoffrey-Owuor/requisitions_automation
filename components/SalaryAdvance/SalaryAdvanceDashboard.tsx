"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Mail, UsersRound } from "lucide-react";
import { getEmailChangeRequestCounts } from "@/serverActions/EmailChangeRequestAdmin";
import SalaryAdvanceCards from "./SalaryAdvanceCards";
import SalaryAdvanceTable from "./SalaryAdvanceTable";
import EmailChangeRequestsPanel, {
  EMAIL_CHANGE_COUNTS_KEY,
} from "./EmailChangeRequestsPanel";
import StaffDirectoryPanel from "./StaffDirectoryPanel";

const VIEWS = [
  { key: "requests", label: "Advance requests", Icon: CircleDollarSign },
  { key: "email-changes", label: "Email changes", Icon: Mail },
  { key: "staff", label: "Staff directory", Icon: UsersRound },
] as const;

type View = (typeof VIEWS)[number]["key"];

// The HR (hr-advance) side of salary advances. Only the active view mounts,
// so only it fetches.
export default function SalaryAdvanceDashboard() {
  const [view, setView] = useState<View>("requests");

  // For the badge on the Email changes tab
  const { data: counts } = useQuery({
    queryKey: EMAIL_CHANGE_COUNTS_KEY,
    queryFn: getEmailChangeRequestCounts,
  });
  const openRequests = counts?.open ?? 0;

  return (
    <div className="space-y-4 p-4">
      <div
        role="tablist"
        aria-label="Salary advance views"
        className="rounded-control flex w-fit max-w-full flex-wrap gap-1 border border-neutral-300 bg-white/60 p-1"
      >
        {VIEWS.map(({ key, label, Icon }) => {
          const isActive = key === view;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setView(key)}
              className={`rounded-compact inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === "email-changes" && openRequests > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white">
                  {openRequests}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {view === "requests" && (
          <>
            <SalaryAdvanceCards />
            <SalaryAdvanceTable />
          </>
        )}
        {view === "email-changes" && <EmailChangeRequestsPanel />}
        {view === "staff" && <StaffDirectoryPanel />}
      </div>
    </div>
  );
}
