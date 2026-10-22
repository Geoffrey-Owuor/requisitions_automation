"use client";

import { use } from "react";
import { ChevronDown } from "lucide-react";
import type { EmployeeDepartmentOverview } from "@/lib/analytics/types";
import { dateFormatter, formatJobGrade } from "@/public/assets";
import {
  BarList,
  SERIES,
  formatCompact,
  formatCount,
  formatKes,
  percent,
} from "@/components/Analytics/AnalyticsPrimitives";

// "Department at a glance" on the Employee approval page: what the
// requisition's department has had approved and has in progress over the
// last 12 months, so an approver sees the context before the positions.
// The page starts loading it after checking the token and streams it in;
// null means it failed, which never blocks the review itself.

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-control border border-[rgba(240,180,180,0.4)] bg-white px-3 py-2.5">
      <p className="text-[11px] text-[#7c5a5a]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-[#1e1b1b]">{value}</p>
      <p className="text-[11px] text-[#a18080]">{detail}</p>
    </div>
  );
}

const plural = (count: number, word: string) =>
  `${formatCount(count)} ${word}${count === 1 ? "" : "s"}`;

function OverviewBody({
  overview,
  department,
}: {
  overview: EmployeeDepartmentOverview;
  department: string;
}) {
  const { totals } = overview;
  const decided = totals.approvedRequisitions + totals.declinedRequisitions;

  if (totals.requisitions === 0) {
    return (
      <p className="rounded-control bg-[#fdf6f6] px-4 py-5 text-center text-[13px] text-[#7c5a5a]">
        No other Employee Requisitions from {department} since{" "}
        {dateFormatter(overview.from)}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat
          label="Headcount approved"
          value={formatCount(totals.approvedHeadcount)}
          detail={plural(totals.approvedRequisitions, "requisition")}
        />
        <Stat
          label="Approved monthly salaries"
          value={
            totals.approvedHeadcount === 0
              ? "—"
              : `${formatKes(totals.approvedSalaryMin)} – ${formatCompact(totals.approvedSalaryMax)}`
          }
          detail="Range times headcount"
        />
        <Stat
          label="Awaiting approval"
          value={formatCount(totals.pendingHeadcount)}
          detail={plural(totals.pendingRequisitions, "requisition")}
        />
        <Stat
          label="Declined"
          value={formatCount(totals.declinedRequisitions)}
          detail={
            totals.avgDaysToDecision === null
              ? `${percent(totals.declinedRequisitions, decided)} of decided`
              : `${percent(totals.declinedRequisitions, decided)} of decided · ${totals.avgDaysToDecision.toFixed(1)} days to decide`
          }
        />
      </div>

      {totals.approvedHeadcount > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-[#7c5a5a]">
              Approved headcount by job grade
            </p>
            <BarList
              color={SERIES.approved}
              items={overview.byGrade.map((row) => ({
                label: formatJobGrade(row.grade, row.rank),
                value: row.headcount,
              }))}
            />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-medium text-[#7c5a5a]">
              New or replacement
            </p>
            <BarList
              color={SERIES.approved}
              items={overview.replacementOrNew.map((row) => ({
                label: row.kind,
                value: row.headcount,
                detail: percent(row.headcount, totals.approvedHeadcount),
              }))}
            />
          </div>
        </div>
      )}

      {overview.recentApproved.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-medium text-[#7c5a5a]">
            Recently approved positions
          </p>
          <ul className="divide-y divide-[rgba(240,180,180,0.4)] text-[13px]">
            {overview.recentApproved.map((position) => (
              <li
                key={position.positionId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2"
              >
                <span className="min-w-0">
                  <span className="font-medium text-[#1e1b1b]">
                    {position.positionTitle}
                  </span>
                  <span className="text-[#7c5a5a]">
                    {" · "}
                    {formatJobGrade(position.grade, position.rank)} ·{" "}
                    {position.replacementOrNew}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-[#a18080]">
                  {formatCount(position.headcount)} headcount ·{" "}
                  {dateFormatter(position.approvedOn)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OverviewFrame({
  department,
  from,
  loading = false,
  children,
}: {
  department: string;
  from: string | null;
  // The skeleton: the subtitle pulses too
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open
      className="group rounded-surface border border-[rgba(240,180,180,0.4)] bg-[#fffafa]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
            {department} at a glance
          </span>
          {loading ? (
            <span
              aria-hidden
              className="mt-1 block h-3 w-64 max-w-full animate-pulse rounded-md bg-neutral-200"
            />
          ) : (
            <span className="block text-[12px] text-[#7c5a5a]">
              {from
                ? `Employee Requisitions submitted since ${dateFormatter(from)}, not counting this one`
                : "The department's last 12 months"}
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#a18080] transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

export default function DepartmentOverview({
  overview: overviewPromise,
  department,
}: {
  overview: Promise<EmployeeDepartmentOverview | null>;
  department: string;
}) {
  const overview = use(overviewPromise);

  return (
    <OverviewFrame department={department} from={overview?.from ?? null}>
      {overview ? (
        <OverviewBody overview={overview} department={department} />
      ) : (
        <p className="rounded-control bg-[#fdf6f6] px-4 py-5 text-center text-[13px] text-[#7c5a5a]">
          The department overview could not be loaded. It doesn&apos;t affect
          this review.
        </p>
      )}
    </OverviewFrame>
  );
}

export function DepartmentOverviewSkeleton({
  department,
}: {
  department: string;
}) {
  return (
    <OverviewFrame department={department} from={null} loading>
      <div aria-hidden className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-control space-y-1.5 border border-[rgba(240,180,180,0.4)] bg-white px-3 py-2.5"
            >
              <div className="h-3 w-20 rounded-md bg-neutral-100" />
              <div className="h-5 w-12 rounded-md bg-neutral-200" />
              <div className="h-3 w-16 rounded-md bg-neutral-100" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-control h-16 bg-neutral-100" />
          <div className="rounded-control h-16 bg-neutral-100" />
        </div>
      </div>
    </OverviewFrame>
  );
}
