"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Coins,
  Hourglass,
  PiggyBank,
  Timer,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import {
  analyticsQueryKey,
  casualBudgetQueryKey,
  fetchAnalytics,
  fetchCasualBudget,
} from "@/lib/analytics/api";
import {
  currentFinancialYear,
  type AnalyticsFilters,
} from "@/lib/analytics/definitions";
import type { CasualBudget, CasualStage } from "@/lib/analytics/types";
import { Select } from "@/components/Select";
import AnalyticsSkeleton from "@/components/Skeletons/AnalyticsSkeleton";
import { DetailsLoadError } from "@/components/Dashboard/DetailsLoadError";
import {
  BarList,
  ChartCard,
  SERIES,
  StatTile,
  formatCompact,
  formatCount,
  formatKes,
  formatKesExact,
  formatMonth,
  percent,
} from "./AnalyticsPrimitives";
import {
  BUDGET_LINE,
  BudgetMonthlyChart,
  DepartmentBars,
  MonthlyBars,
} from "./Charts";

const STAGE_LABELS: Record<CasualStage, string> = { hod: "HOD", hr: "HR" };

const plural = (count: number, word: string) =>
  `${formatCount(count)} ${word}${count === 1 ? "" : "s"}`;

export default function CasualAnalytics({
  filters,
  today,
}: {
  filters: AnalyticsFilters;
  // YYYY-MM-DD in Nairobi time, for the default financial year
  today: string;
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: analyticsQueryKey("casual", filters),
    queryFn: () => fetchAnalytics("casual", filters),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <AnalyticsSkeleton />;
  if (isError) {
    return (
      <DetailsLoadError
        message="The Casual Requisition analytics could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const { totals } = data;
  const decided = totals.approvedRequisitions + totals.declinedRequisitions;

  return (
    <div className="space-y-4">
      <div
        aria-busy={isPlaceholderData}
        className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
      >
        {/* Headline figures */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            Icon={UsersRound}
            label="Casuals requested"
            value={formatCount(totals.casualsRequested)}
            detail={`${plural(totals.requisitions, "requisition")} · ${formatKes(totals.requestedAmount)}`}
          />
          <StatTile
            Icon={CircleCheck}
            label="Approved amount"
            value={formatKes(totals.approvedAmount)}
            detail={`${plural(totals.approvedCasuals, "casual")} · ${plural(totals.approvedRequisitions, "requisition")}`}
          />
          <StatTile
            Icon={Hourglass}
            label="Awaiting approval"
            value={formatKes(totals.pendingAmount)}
            detail={`${plural(totals.pendingRequisitions, "requisition")} in progress`}
          />
          <StatTile
            Icon={CircleX}
            label="Requisitions declined"
            value={formatCount(totals.declinedRequisitions)}
            detail={`${percent(totals.declinedRequisitions, decided)} of decided requisitions`}
          />
          <StatTile
            Icon={CalendarDays}
            label="Approved casual-days"
            value={formatCount(totals.approvedCasualDays)}
            detail={
              totals.avgDailyRate === null
                ? "Casuals times engagement days"
                : `Average ${formatKesExact(Math.round(totals.avgDailyRate))} per casual-day`
            }
          />
          <StatTile
            Icon={Timer}
            label="Average days to decision"
            value={
              totals.avgDaysToDecision === null
                ? "—"
                : totals.avgDaysToDecision.toFixed(1)
            }
            detail={`${plural(totals.amendedRequisitions, "requisition")} amended`}
          />
        </div>

        {/* Trend */}
        <ChartCard
          title="Amount by month"
          subtitle="By submission month: everything requested, and what has been fully approved (KES, before statutory costs)"
          legend={[
            { label: "Requested", color: SERIES.requested },
            { label: "Approved", color: SERIES.approved },
          ]}
          isEmpty={totals.requisitions === 0}
          table={{
            columns: ["Month", "Requested (KES)", "Approved (KES)"],
            rows: data.monthly.map((row) => [
              formatMonth(row.month),
              row.requestedAmount,
              row.approvedAmount,
            ]),
          }}
        >
          <MonthlyBars
            data={data.monthly}
            series={[
              {
                key: "requestedAmount",
                label: "Requested",
                color: SERIES.requested,
              },
              {
                key: "approvedAmount",
                label: "Approved",
                color: SERIES.approved,
              },
            ]}
            formatValue={formatKesExact}
            formatAxis={formatCompact}
          />
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          {!filters.department && (
            <ChartCard
              className="lg:col-span-2"
              title="Amount by department"
              subtitle="Approved, and still awaiting approval (KES)"
              legend={[
                { label: "Approved", color: SERIES.approved },
                { label: "Awaiting approval", color: SERIES.pending },
              ]}
              isEmpty={data.byDepartment.length === 0}
              table={{
                columns: [
                  "Department",
                  "Approved (KES)",
                  "Awaiting approval (KES)",
                ],
                rows: data.byDepartment.map((row) => [
                  row.department,
                  row.approvedAmount,
                  row.pendingAmount,
                ]),
              }}
            >
              <DepartmentBars
                data={data.byDepartment}
                series={[
                  {
                    key: "approvedAmount",
                    label: "Approved",
                    color: SERIES.approved,
                  },
                  {
                    key: "pendingAmount",
                    label: "Awaiting approval",
                    color: SERIES.pending,
                  },
                ]}
                formatValue={formatKesExact}
                formatAxis={formatCompact}
              />
            </ChartCard>
          )}

          <ChartCard
            title="Approved amount by location"
            subtitle="With the casual-days behind it"
            isEmpty={data.byLocation.length === 0}
            emptyText="No approved requisitions for these filters"
            table={{
              columns: ["Location", "Casual-days", "Amount (KES)"],
              rows: data.byLocation.map((row) => [
                row.location,
                row.casualDays,
                row.amount,
              ]),
            }}
          >
            <BarList
              color={SERIES.approved}
              formatValue={formatKes}
              items={data.byLocation.map((row) => ({
                label: row.location,
                value: row.amount,
                detail: `(${plural(row.casualDays, "casual-day")})`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Approved amount by category"
            subtitle="Departments that don't ask for a category show as No category"
            isEmpty={data.byCategory.length === 0}
            emptyText="No approved requisitions for these filters"
            table={{
              columns: ["Category", "Casual-days", "Amount (KES)"],
              rows: data.byCategory.map((row) => [
                row.category,
                row.casualDays,
                row.amount,
              ]),
            }}
          >
            <BarList
              color={SERIES.approved}
              formatValue={formatKes}
              items={data.byCategory.map((row) => ({
                label: row.category,
                value: row.amount,
                detail: `(${plural(row.casualDays, "casual-day")})`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Top sections"
            subtitle="Approved amount by section"
            isEmpty={data.topSections.length === 0}
            emptyText="No approved requisitions for these filters"
            table={{
              columns: ["Section", "Department", "Casual-days", "Amount (KES)"],
              rows: data.topSections.map((row) => [
                row.section,
                row.department,
                row.casualDays,
                row.amount,
              ]),
            }}
          >
            <BarList
              color={SERIES.approved}
              formatValue={formatKes}
              items={data.topSections.map((row) => ({
                label: row.section,
                value: row.amount,
                detail: `(${plural(row.casualDays, "casual-day")})`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Awaiting approval, by stage"
            subtitle="Requisitions in progress and the stage each waits on"
            isEmpty={data.pipeline.length === 0}
            emptyText="Nothing is awaiting approval"
            table={{
              columns: ["Stage", "Requisitions", "Amount (KES)"],
              rows: data.pipeline.map((row) => [
                STAGE_LABELS[row.stage],
                row.requisitions,
                row.amount,
              ]),
            }}
          >
            <BarList
              color={SERIES.pending}
              items={data.pipeline.map((row) => ({
                label: STAGE_LABELS[row.stage],
                value: row.requisitions,
                detail: `(${formatKes(row.amount)})`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Declines, by stage"
            subtitle="The stage that declined each requisition"
            isEmpty={data.declines.length === 0}
            emptyText="No declined requisitions for these filters"
            table={{
              columns: ["Stage", "Requisitions"],
              rows: data.declines.map((row) => [
                STAGE_LABELS[row.stage],
                row.requisitions,
              ]),
            }}
          >
            <BarList
              color={SERIES.declined}
              items={data.declines.map((row) => ({
                label: STAGE_LABELS[row.stage],
                value: row.requisitions,
              }))}
            />
          </ChartCard>
        </div>
      </div>

      <BudgetSection department={filters.department} today={today} />
    </div>
  );
}

// ─── Budget ───────────────────────────────────────────────────────────────────

// Budgets run by financial year and count spend in the month an engagement
// starts, so this section has its own year picker and ignores the dates above
function BudgetSection({
  department,
  today,
}: {
  department: string;
  today: string;
}) {
  const [financialYear, setFinancialYear] = useState(() =>
    currentFinancialYear(today),
  );
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: casualBudgetQueryKey(financialYear, department),
    queryFn: () => fetchCasualBudget(financialYear, department),
    placeholderData: keepPreviousData,
  });

  return (
    <section
      aria-labelledby="casual-budget"
      className="rounded-surface space-y-4 border border-neutral-200 bg-neutral-50/60 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="casual-budget"
            className="flex items-center gap-2 text-base font-semibold text-neutral-900"
          >
            <PiggyBank className="h-4.5 w-4.5 text-neutral-500" />
            Budget
          </h2>
          <p className="mt-0.5 max-w-2xl text-xs text-neutral-500">
            Budgets against spend for a financial year (April to March), by the
            month each engagement starts, statutory costs included — as the
            casual form&apos;s budget estimate counts it. The submission dates
            above don&apos;t apply here
            {department ? `; showing ${department} only` : ""}.
          </p>
        </div>
        <div className="w-40">
          <Select
            tone="slate"
            aria-label="Financial year"
            value={financialYear}
            onChange={setFinancialYear}
            options={(data?.financialYears ?? [financialYear]).map((year) => ({
              value: year,
              label: `FY ${year}`,
            }))}
          />
        </div>
      </div>

      {isPending ? (
        <AnalyticsSkeleton />
      ) : isError ? (
        <DetailsLoadError
          message="The casual budget could not be loaded."
          onRetry={() => refetch()}
        />
      ) : (
        <BudgetBody data={data} dimmed={isPlaceholderData} />
      )}
    </section>
  );
}

function BudgetBody({ data, dimmed }: { data: CasualBudget; dimmed: boolean }) {
  const { totals } = data;
  const spent = totals.approvedSpend + totals.baseline;
  const remaining = totals.budget - spent;
  const projected = spent + totals.pendingSpend;

  return (
    <div
      aria-busy={dimmed}
      className={`space-y-4 transition-opacity ${dimmed ? "opacity-60" : ""}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          Icon={PiggyBank}
          label={`Budget, FY ${data.financialYear}`}
          value={formatKes(totals.budget)}
          detail={
            totals.budget === 0 ? "No budget set for this year" : "All months"
          }
        />
        <StatTile
          Icon={Coins}
          label="Spent"
          value={formatKes(spent)}
          detail={`${percent(spent, totals.budget)} of budget · includes ${formatKes(totals.baseline)} recorded outside the app`}
        />
        <StatTile
          Icon={remaining < 0 ? TriangleAlert : CircleCheck}
          label={remaining < 0 ? "Over budget" : "Remaining"}
          value={formatKes(Math.abs(remaining))}
          detail={
            remaining < 0
              ? "Spent beyond the year's budget"
              : "Left in the year's budget"
          }
        />
        <StatTile
          Icon={Hourglass}
          label="If everything pending is approved"
          value={percent(projected, totals.budget)}
          detail={`of budget used · ${formatKes(totals.pendingSpend)} awaiting approval`}
        />
      </div>

      <ChartCard
        title="Spend against budget, by month"
        subtitle="Approved and awaiting-approval spend in the month each engagement starts; the dashed line is the month's budget"
        legend={[
          { label: "Approved", color: SERIES.approved },
          { label: "Awaiting approval", color: SERIES.pending },
          { label: "Budget", color: BUDGET_LINE.color },
        ]}
        isEmpty={
          totals.budget === 0 &&
          totals.approvedSpend + totals.pendingSpend === 0
        }
        emptyText="No budget or spend for this financial year"
        table={{
          columns: [
            "Month",
            "Budget (KES)",
            "Approved (KES)",
            "Awaiting approval (KES)",
          ],
          rows: data.monthly.map((row) => [
            formatMonth(row.month),
            row.budget,
            row.approvedSpend,
            row.pendingSpend,
          ]),
        }}
      >
        <BudgetMonthlyChart data={data.monthly} />
      </ChartCard>

      <ChartCard
        title="Budget used, by department"
        subtitle="Spent (approved plus spend recorded outside the app) against each department's budget for the year, most used first"
        legend={[
          { label: "Spent", color: SERIES.approved },
          { label: "Awaiting approval", color: SERIES.pending },
        ]}
        isEmpty={data.byDepartment.length === 0}
        emptyText="No budget or spend for this financial year"
        table={{
          columns: [
            "Department",
            "Budget (KES)",
            "Spent (KES)",
            "Used",
            "Awaiting approval (KES)",
          ],
          rows: data.byDepartment.map((row) => [
            row.department,
            row.budget,
            row.spent,
            percent(row.spent, row.budget),
            row.pendingSpend,
          ]),
        }}
      >
        <BudgetBars rows={data.byDepartment} />
      </ChartCard>
    </div>
  );
}

// One track per department: the full track is its budget, filled with what's
// spent and then what's awaiting approval. Over budget is called out in text
// with an icon, never by color alone.
function BudgetBars({ rows }: { rows: CasualBudget["byDepartment"] }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const scale = Math.max(row.budget, row.spent + row.pendingSpend, 1);
        const over = row.spent > row.budget;
        return (
          <li key={row.department} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="truncate text-neutral-700">
                {row.department}
              </span>
              <span className="flex items-center gap-1.5 text-neutral-900 tabular-nums">
                {row.budget === 0 ? (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                    No budget set
                  </span>
                ) : (
                  over && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      <TriangleAlert className="h-3 w-3" />
                      Over budget
                    </span>
                  )
                )}
                <span className="font-semibold">{formatKes(row.spent)}</span>
                <span className="text-neutral-500">
                  {row.budget > 0 ? `of ${formatKes(row.budget)}` : "spent"}
                  {row.budget > 0 && ` · ${percent(row.spent, row.budget)}`}
                </span>
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200/70">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${(row.spent / scale) * 100}%`,
                  backgroundColor: SERIES.approved,
                }}
              />
              <div
                className="absolute inset-y-0 border-l-2 border-white"
                style={{
                  left: `${(row.spent / scale) * 100}%`,
                  width: `${(row.pendingSpend / scale) * 100}%`,
                  backgroundColor: SERIES.pending,
                }}
              />
              {row.budget > 0 && row.budget < scale && (
                // The budget mark, when spend runs past it
                <div
                  aria-hidden
                  className="absolute inset-y-0 w-0.5 bg-neutral-900"
                  style={{ left: `${(row.budget / scale) * 100}%` }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
