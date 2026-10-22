"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CircleCheck,
  CircleX,
  Hourglass,
  Plane,
  ReceiptText,
  Timer,
} from "lucide-react";
import { analyticsQueryKey, fetchAnalytics } from "@/lib/analytics/api";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type {
  TravelAnalytics as TravelData,
  TravelStage,
} from "@/lib/analytics/types";
import { dateFormatter } from "@/public/assets";
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

const STAGE_LABELS: Record<TravelStage, string> = {
  hod: "HOD",
  hr: "HR",
  director: "Director",
};

const listHeading =
  "-mb-2 text-[11px] font-bold tracking-widest text-gray-400 uppercase";

const trips = (count: number) =>
  `${formatCount(count)} trip${count === 1 ? "" : "s"}`;

export default function TravelAnalytics({
  filters,
}: {
  filters: AnalyticsFilters;
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: analyticsQueryKey("travel", filters),
    queryFn: () => fetchAnalytics("travel", filters),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <AnalyticsSkeleton />;
  if (isError) {
    return (
      <DetailsLoadError
        message="The Travel Requisition analytics could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const { totals } = data;
  const decided = totals.approvedTrips + totals.declinedTrips;

  return (
    <div
      aria-busy={isPlaceholderData}
      className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
    >
      {/* Headline figures */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          Icon={Plane}
          label="Trips requested"
          value={formatCount(totals.trips)}
          detail={`${formatKes(totals.requestedSpend)} in total`}
        />
        <StatTile
          Icon={CircleCheck}
          label="Approved spend"
          value={formatKes(totals.approvedSpend)}
          detail={`${trips(totals.approvedTrips)} fully approved`}
        />
        <StatTile
          Icon={Hourglass}
          label="Awaiting approval"
          value={formatKes(totals.pendingSpend)}
          detail={`${trips(totals.pendingTrips)} in progress`}
        />
        <StatTile
          Icon={CircleX}
          label="Trips declined"
          value={formatCount(totals.declinedTrips)}
          detail={`${percent(totals.declinedTrips, decided)} of decided trips`}
        />
        <StatTile
          Icon={ReceiptText}
          label="Average approved trip"
          value={
            totals.avgApprovedCost === null
              ? "—"
              : formatKes(totals.avgApprovedCost)
          }
          detail={`${percent(totals.approvedWithinBudget, totals.approvedTrips)} of approved trips within budget`}
        />
        <StatTile
          Icon={Timer}
          label="Average days to decision"
          value={
            totals.avgDaysToDecision === null
              ? "—"
              : totals.avgDaysToDecision.toFixed(1)
          }
          detail={`${formatCount(totals.pushbacks)} HR push-back${totals.pushbacks === 1 ? "" : "s"} · ${trips(totals.amendedTrips)} amended`}
        />
      </div>

      {/* Trend */}
      <ChartCard
        title="Spend by month"
        subtitle="By submission month: everything requested, and what has been fully approved (KES)"
        legend={[
          { label: "Requested", color: SERIES.requested },
          { label: "Approved", color: SERIES.approved },
        ]}
        isEmpty={totals.trips === 0}
        table={{
          columns: ["Month", "Requested (KES)", "Approved (KES)"],
          rows: data.monthly.map((row) => [
            formatMonth(row.month),
            row.requestedSpend,
            row.approvedSpend,
          ]),
        }}
      >
        <MonthlyBars
          data={data.monthly}
          series={[
            {
              key: "requestedSpend",
              label: "Requested",
              color: SERIES.requested,
            },
            { key: "approvedSpend", label: "Approved", color: SERIES.approved },
          ]}
          formatValue={formatKesExact}
          formatAxis={formatCompact}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {!filters.department && (
          <ChartCard
            className="lg:col-span-2"
            title="Spend by department"
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
                row.approvedSpend,
                row.pendingSpend,
              ]),
            }}
          >
            <DepartmentBars
              data={data.byDepartment}
              series={[
                {
                  key: "approvedSpend",
                  label: "Approved",
                  color: SERIES.approved,
                },
                {
                  key: "pendingSpend",
                  label: "Awaiting approval",
                  color: SERIES.pending,
                },
              ]}
              formatValue={formatKesExact}
              formatAxis={formatCompact}
            />
          </ChartCard>
        )}

        <CostPartsCard data={data} />

        <ChartCard
          title="Trips by approval tier"
          subtitle="Approved trips and their spend, of all trips requested"
          isEmpty={data.byTier.length === 0}
          table={{
            columns: ["Tier", "Requested", "Approved", "Approved (KES)"],
            rows: data.byTier.map((row) => [
              row.tier,
              row.trips,
              row.approvedTrips,
              row.approvedSpend,
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.byTier.map((row) => ({
              label: row.tier,
              value: row.approvedTrips,
              detail: `of ${formatCount(row.trips)} · ${formatKes(row.approvedSpend)}`,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Top destinations"
          subtitle="Approved trips, by spend"
          isEmpty={data.topDestinations.length === 0}
          emptyText="No approved trips for these filters"
          table={{
            columns: ["Destination", "Trips", "Spend (KES)"],
            rows: data.topDestinations.map((row) => [
              row.destination,
              row.trips,
              row.spend,
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            formatValue={formatKes}
            items={data.topDestinations.map((row) => ({
              label: row.destination,
              value: row.spend,
              detail: `(${trips(row.trips)})`,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Travel mode and category"
          subtitle="Approved trips"
          isEmpty={data.byMode.length === 0}
          emptyText="No approved trips for these filters"
          table={{
            columns: ["Mode or category", "Trips"],
            rows: [
              ...data.byMode.map((row) => [`Mode: ${row.mode}`, row.trips]),
              ...data.byCategory.map((row) => [
                `Category: ${row.category}`,
                row.trips,
              ]),
            ],
          }}
        >
          <div className="space-y-4">
            <p className={listHeading}>Mode</p>
            <BarList
              color={SERIES.approved}
              items={data.byMode.map((row) => ({
                label: row.mode,
                value: row.trips,
                detail: percent(row.trips, totals.approvedTrips),
              }))}
            />
            <div className="space-y-4 border-t border-neutral-100 pt-3">
              <p className={listHeading}>Category</p>
              <BarList
                color={SERIES.approved}
                items={data.byCategory.map((row) => ({
                  label: row.category,
                  value: row.trips,
                  detail: percent(row.trips, totals.approvedTrips),
                }))}
              />
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Awaiting approval, by stage"
          subtitle="Trips in progress and the stage each waits on"
          isEmpty={data.pipeline.length === 0}
          emptyText="Nothing is awaiting approval"
          table={{
            columns: ["Stage", "Trips", "Spend (KES)"],
            rows: data.pipeline.map((row) => [
              STAGE_LABELS[row.stage],
              row.trips,
              row.spend,
            ]),
          }}
        >
          <BarList
            color={SERIES.pending}
            items={data.pipeline.map((row) => ({
              label: STAGE_LABELS[row.stage],
              value: row.trips,
              detail: `(${formatKes(row.spend)})`,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Declines, by stage"
          subtitle="The stage that declined each trip"
          isEmpty={data.declines.length === 0}
          emptyText="No declined trips for these filters"
          table={{
            columns: ["Stage", "Trips"],
            rows: data.declines.map((row) => [
              STAGE_LABELS[row.stage],
              row.trips,
            ]),
          }}
        >
          <BarList
            color={SERIES.declined}
            items={data.declines.map((row) => ({
              label: STAGE_LABELS[row.stage],
              value: row.trips,
            }))}
          />
        </ChartCard>
      </div>

      <LargestApproved trips={data.largestApproved} />
    </div>
  );
}

function CostPartsCard({ data }: { data: TravelData }) {
  const { transport, perDiem, other } = data.approvedCostParts;
  const parts = [
    { label: "Transport", value: transport },
    { label: "Per diem", value: perDiem },
    { label: "Other costs", value: other },
  ];
  return (
    <ChartCard
      title="Approved spend by cost type"
      subtitle="What approved trips are spent on"
      isEmpty={data.totals.approvedTrips === 0}
      emptyText="No approved trips for these filters"
      table={{
        columns: ["Cost type", "KES", "Share"],
        rows: parts.map((part) => [
          part.label,
          part.value,
          percent(part.value, data.totals.approvedSpend),
        ]),
      }}
    >
      <BarList
        color={SERIES.approved}
        formatValue={formatKes}
        items={parts.map((part) => ({
          ...part,
          detail: percent(part.value, data.totals.approvedSpend),
        }))}
      />
    </ChartCard>
  );
}

function LargestApproved({
  trips: rows,
}: {
  trips: TravelData["largestApproved"];
}) {
  return (
    <section
      aria-label="Largest approved trips"
      className="rounded-surface border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-neutral-900">
        Largest approved trips
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500">
        The most expensive approved trips among these requisitions
      </p>
      {rows.length === 0 ? (
        <p className="rounded-control mt-3 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
          No approved trips for these filters
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Traveller
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Department
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Destination
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Departure
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Tier
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Total (KES)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((trip) => (
                <tr key={trip.requestId} className="text-neutral-700">
                  <td className="py-2 pr-3 font-medium text-neutral-900">
                    {trip.employeeName}
                  </td>
                  <td className="py-2 pr-3">{trip.department}</td>
                  <td className="py-2 pr-3">{trip.destination}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {dateFormatter(trip.departureDate)}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{trip.tier}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatCount(trip.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
