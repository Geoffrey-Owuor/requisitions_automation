"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CircleCheck,
  CircleX,
  Hourglass,
  Repeat,
  Timer,
  Wallet,
} from "lucide-react";
import { analyticsQueryKey, fetchAnalytics } from "@/lib/analytics/api";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { AdvanceAnalytics as AdvanceData } from "@/lib/analytics/types";
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
import { DepartmentBars, MonthlyBars } from "./Charts";

const ALTERATION_LABELS: Record<
  AdvanceData["alterations"][number]["kind"],
  string
> = {
  switch_to_oneoff: "Switched continuous to one-off",
  reduce_installments: "Reduced remaining installments",
};

const requests = (count: number) =>
  `${formatCount(count)} ${count === 1 ? "request" : "requests"}`;

const installmentsLabel = (count: number) =>
  `${count} ${count === 1 ? "installment" : "installments"}`;

export default function AdvanceAnalytics({
  filters,
}: {
  filters: AnalyticsFilters;
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: analyticsQueryKey("advance", filters),
    queryFn: () => fetchAnalytics("advance", filters),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <AnalyticsSkeleton />;
  if (isError) {
    return (
      <DetailsLoadError
        message="The salary advance analytics could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const { totals } = data;
  const decided = totals.approvedRequests + totals.declinedRequests;
  const approvedOneoff = data.byInstallments.reduce(
    (sum, row) => sum + row.requests,
    0,
  );
  const activeRequests = totals.approvedRequests + totals.pendingRequests;

  return (
    <div
      aria-busy={isPlaceholderData}
      className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
    >
      {/* Headline figures */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          Icon={Wallet}
          label="Requests submitted"
          value={formatCount(totals.requests)}
          detail={`${formatCount(totals.staff)} staff · ${formatCount(totals.repeatStaff)} with more than one`}
        />
        <StatTile
          Icon={CircleCheck}
          label="Approved one-off advances"
          value={formatKes(totals.approvedOneoffAmount)}
          detail={`${requests(approvedOneoff)} · ${
            totals.avgApprovedOneoff === null
              ? "no average yet"
              : `${formatKes(totals.avgApprovedOneoff)} on average`
          }`}
        />
        <StatTile
          Icon={Repeat}
          label="Approved continuous deductions"
          value={`${formatKes(totals.approvedContinuousAmount)} / month`}
          detail={`${requests(totals.approvedContinuousRequests)}, each a standing monthly deduction`}
        />
        <StatTile
          Icon={Hourglass}
          label="Awaiting HR review"
          value={formatCount(totals.pendingRequests)}
          detail={`${formatKes(totals.pendingOneoffAmount)} in one-off advances`}
        />
        <StatTile
          Icon={CircleX}
          label="Declined"
          value={formatCount(totals.declinedRequests)}
          detail={`${percent(totals.declinedRequests, decided)} of reviewed requests`}
        />
        <StatTile
          Icon={Timer}
          label="Average days to HR review"
          value={
            totals.avgDaysToReview === null
              ? "—"
              : totals.avgDaysToReview.toFixed(1)
          }
          detail="From submission to HR approving or declining"
        />
      </div>

      {/* Trend */}
      <ChartCard
        title="Requests by month"
        subtitle="By submission month: everything requested, and what HR approved"
        legend={[
          { label: "Requested", color: SERIES.requested },
          { label: "Approved", color: SERIES.approved },
        ]}
        isEmpty={totals.requests === 0}
        table={{
          columns: ["Month", "Requested", "Approved"],
          rows: data.monthly.map((row) => [
            formatMonth(row.month),
            row.requested,
            row.approved,
          ]),
        }}
      >
        <MonthlyBars
          data={data.monthly}
          series={[
            { key: "requested", label: "Requested", color: SERIES.requested },
            { key: "approved", label: "Approved", color: SERIES.approved },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="One-off advances by repayment start"
        subtitle="The month deductions begin, for requests submitted in the range"
        legend={[
          { label: "Approved", color: SERIES.approved },
          { label: "Awaiting HR", color: SERIES.pending },
        ]}
        isEmpty={data.byRepaymentMonth.length === 0}
        emptyText="No approved or pending one-off advances for these filters"
        table={{
          columns: ["Repayment starts", "Approved (KES)", "Awaiting HR (KES)"],
          rows: data.byRepaymentMonth.map((row) => [
            formatMonth(row.month),
            formatKesExact(row.approvedAmount),
            formatKesExact(row.pendingAmount),
          ]),
        }}
      >
        <MonthlyBars
          data={data.byRepaymentMonth}
          series={[
            {
              key: "approvedAmount",
              label: "Approved",
              color: SERIES.approved,
            },
            {
              key: "pendingAmount",
              label: "Awaiting HR",
              color: SERIES.pending,
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
            title="Requests by department"
            subtitle="Approved by HR, and still awaiting review"
            legend={[
              { label: "Approved", color: SERIES.approved },
              { label: "Awaiting HR", color: SERIES.pending },
            ]}
            isEmpty={data.byDepartment.length === 0}
            table={{
              columns: ["Department", "Approved", "Awaiting HR"],
              rows: data.byDepartment.map((row) => [
                row.department,
                row.approved,
                row.pending,
              ]),
            }}
          >
            <DepartmentBars
              data={data.byDepartment}
              series={[
                { key: "approved", label: "Approved", color: SERIES.approved },
                { key: "pending", label: "Awaiting HR", color: SERIES.pending },
              ]}
            />
          </ChartCard>
        )}

        <ChartCard
          title="One-off advance sizes"
          subtitle="Approved one-off advances by amount"
          isEmpty={data.byAmountBand.length === 0}
          emptyText="No approved one-off advances for these filters"
          table={{
            columns: ["Amount", "Requests", "Total (KES)"],
            rows: data.byAmountBand.map((row) => [
              row.band,
              row.requests,
              formatKesExact(row.amount),
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.byAmountBand.map((row) => ({
              label: row.band,
              value: row.requests,
              detail: percent(row.requests, approvedOneoff),
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Repayment period"
          subtitle="Installments chosen on approved one-off advances"
          isEmpty={data.byInstallments.length === 0}
          emptyText="No approved one-off advances for these filters"
          table={{
            columns: ["Installments", "Requests", "Share"],
            rows: data.byInstallments.map((row) => [
              row.installments,
              row.requests,
              percent(row.requests, approvedOneoff),
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.byInstallments.map((row) => ({
              label: installmentsLabel(row.installments),
              value: row.requests,
              detail: percent(row.requests, approvedOneoff),
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Requests by location"
          subtitle="Approved and awaiting HR review"
          isEmpty={data.byLocation.length === 0}
          table={{
            columns: ["Location", "Requests", "Share"],
            rows: data.byLocation.map((row) => [
              row.location,
              row.requests,
              percent(row.requests, activeRequests),
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.byLocation.map((row) => ({
              label: row.location,
              value: row.requests,
              detail: percent(row.requests, activeRequests),
            }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-4">
          <ChartCard
            title="One-off or continuous"
            subtitle="Every request submitted, by repayment type"
            isEmpty={totals.requests === 0}
            table={{
              columns: ["Type", "Requests", "Amount (KES)"],
              rows: [
                [
                  "One-off",
                  totals.oneoffRequests,
                  formatKesExact(totals.oneoffAmount),
                ],
                [
                  "Continuous (per month)",
                  totals.continuousRequests,
                  formatKesExact(totals.continuousAmount),
                ],
              ],
            }}
          >
            <BarList
              color={SERIES.requested}
              items={[
                { label: "One-off", value: totals.oneoffRequests },
                { label: "Continuous", value: totals.continuousRequests },
              ].map((row) => ({
                ...row,
                detail: percent(row.value, totals.requests),
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Self-service alterations"
            subtitle="Changes staff made after their request was exported"
            isEmpty={data.alterations.length === 0}
            emptyText="No alterations on requests in this range"
            table={{
              columns: ["Alteration", "Requests"],
              rows: data.alterations.map((row) => [
                ALTERATION_LABELS[row.kind],
                row.requests,
              ]),
            }}
          >
            <BarList
              color={SERIES.requested}
              items={data.alterations.map((row) => ({
                label: ALTERATION_LABELS[row.kind],
                value: row.requests,
              }))}
            />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
