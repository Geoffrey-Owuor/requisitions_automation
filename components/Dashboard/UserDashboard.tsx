"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, CircleCheck, RotateCcw } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import {
  REQUISITION_TYPES,
  getVisibleTables,
  type DashboardTableEntry,
  type RequisitionTypeEntry,
} from "@/lib/dashboardTables";
import DashboardWatermark from "../Modules/DashboardWaterMark";
import DashboardAlert from "./DashboardAlert";
import DashboardQuickActions from "./DashboardQuickActions";

const CARD_CLASS =
  "group flex flex-col gap-3 rounded-2xl border bg-white/50 p-4 shadow-[0_12px_24px_rgba(160,60,60,0.05)] transition-all hover:bg-white/80";
const GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

// A count from the summary, a pulsing placeholder while it loads, or a
// dash if the summary failed to load
function Count({ value, className }: { value?: number; className: string }) {
  const failed = useDashboardSummary().isError;
  if (value === undefined && failed) {
    return <span className={className}>–</span>;
  }
  if (value === undefined) {
    return (
      <span
        className={`inline-block h-7 w-8 animate-pulse rounded-md bg-neutral-200/80 ${className}`}
      />
    );
  }
  return <span className={className}>{value}</span>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-bold tracking-widest text-neutral-500 uppercase">
      {children}
    </h2>
  );
}

function ApprovalCard({
  type,
  queues,
  counts,
}: {
  type: RequisitionTypeEntry;
  queues: DashboardTableEntry[];
  counts?: Record<string, number>;
}) {
  const total = counts
    ? queues.reduce((sum, entry) => sum + (counts[entry.key] ?? 0), 0)
    : undefined;
  const hasWaiting = !!total;

  return (
    <Link
      href={`${type.href}?tab=pending`}
      className={`${CARD_CLASS} ${hasWaiting ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-red-200"}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1e1b1b]">
        <type.Icon className="h-4 w-4 text-neutral-500" />
        <span className="flex-1">{type.label}</span>
        <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-400" />
      </div>

      <div className="flex items-baseline gap-2">
        <Count
          value={total}
          className={`text-2xl font-semibold ${hasWaiting ? "text-red-600" : "text-neutral-400"}`}
        />
        <span className="text-xs text-[#a18080]">
          {total === 0 ? "All caught up" : "waiting"}
        </span>
      </div>

      {/* Per-stage breakdown, only worth showing for multi-stage approvers */}
      {queues.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {queues.map((entry) => {
            const count = counts?.[entry.key];
            return (
              <span
                key={entry.key}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${count ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-500"}`}
              >
                {entry.stage} {count ?? "–"}
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}

function MineCard({
  type,
  count,
}: {
  type: RequisitionTypeEntry;
  count?: number;
}) {
  return (
    <Link
      href={`${type.href}?tab=mine`}
      className={`${CARD_CLASS} border-gray-200 hover:border-red-200`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1e1b1b]">
        <type.Icon className="h-4 w-4 text-neutral-500" />
        <span className="flex-1">{type.label}</span>
        <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-400" />
      </div>
      <div className="flex items-baseline gap-2">
        <Count
          value={count}
          className="text-2xl font-semibold text-neutral-700"
        />
        <span className="text-xs text-[#a18080]">
          {count === 0 ? "None yet" : "submitted"}
        </span>
      </div>
    </Link>
  );
}

// Dashboard home: what's waiting for the viewer's approval, their own
// submissions, and shortcuts to every form. Each count links to that
// requisition type's page (components/Dashboard/RequisitionTypeDashboard.tsx),
// where the tables live — so the home page makes one summary request
// instead of loading every table.
const UserDashboard = () => {
  const { username, email: userEmail, roles, memberships } = useUser();
  const firstName = username?.split(" ")[0];

  // --- CACHE USER FOR QUICK SIGN-IN ---
  useEffect(() => {
    if (username && userEmail) {
      localStorage.setItem(
        "Requisitions_Automation_lastUser",
        JSON.stringify({ name: username, email: userEmail }),
      );
    }
  }, [username, userEmail]);

  const { data, isError, refetch } = useDashboardSummary();
  const counts = data?.counts;

  const visibleTables = getVisibleTables({ roles, memberships });
  const approvalTypes = REQUISITION_TYPES.map((type) => ({
    type,
    queues: visibleTables.filter(
      (entry) => entry.type === type.type && entry.tab === "pending",
    ),
  })).filter(({ queues }) => queues.length > 0);

  const totalPending = counts
    ? approvalTypes.reduce(
        (sum, { queues }) =>
          sum +
          queues.reduce(
            (typeSum, entry) => typeSum + (counts[entry.key] ?? 0),
            0,
          ),
        0,
      )
    : undefined;

  let subtitle = "Here's an overview of your requisitions.";
  if (approvalTypes.length > 0 && totalPending !== undefined) {
    subtitle =
      totalPending > 0
        ? `${totalPending} ${totalPending === 1 ? "request is" : "requests are"} waiting for your approval.`
        : "Nothing is waiting for your approval.";
  }

  return (
    <div className="relative h-full p-2">
      {/* The dashboard alert */}
      <DashboardAlert />
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center overflow-hidden lg:left-[calc(80px+(100vw-80px)/2)]">
        {/* ---------- WATERMARK LAYER ---------- */}
        <DashboardWatermark />
      </div>

      <div className="relative z-10 space-y-8 py-2">
        <header>
          <h1 className="text-xl font-semibold text-[#1e1b1b]">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#a18080]">
            {totalPending === 0 && approvalTypes.length > 0 && (
              <CircleCheck className="h-4 w-4 text-emerald-500" />
            )}
            {subtitle}
          </p>
        </header>

        {isError && !data && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700">
            <span className="flex-1">
              Couldn&apos;t load your requisition counts.
            </span>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {approvalTypes.length > 0 && (
          <section>
            <SectionHeading>Needs your approval</SectionHeading>
            <div className={GRID_CLASS}>
              {approvalTypes.map(({ type, queues }) => (
                <ApprovalCard
                  key={type.type}
                  type={type}
                  queues={queues}
                  counts={counts}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading>Your requisitions</SectionHeading>
          <div className={GRID_CLASS}>
            {REQUISITION_TYPES.map((type) => (
              <MineCard
                key={type.type}
                type={type}
                count={counts?.[`${type.type}-userData`]}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Start a new request</SectionHeading>
          <DashboardQuickActions />
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
