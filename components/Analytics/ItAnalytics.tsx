"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleCheck,
  CircleX,
  Hourglass,
  Laptop,
  Timer,
} from "lucide-react";
import { analyticsQueryKey, fetchAnalytics } from "@/lib/analytics/api";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import type { ItStage } from "@/lib/analytics/types";
import AnalyticsSkeleton from "@/components/Skeletons/AnalyticsSkeleton";
import { DetailsLoadError } from "@/components/Dashboard/DetailsLoadError";
import {
  BarList,
  ChartCard,
  SERIES,
  StatTile,
  formatCount,
  formatMonth,
  percent,
} from "./AnalyticsPrimitives";
import { DepartmentBars, MonthlyBars } from "./Charts";

const STAGE_LABELS: Record<ItStage, string> = { hod: "HOD", it: "IT" };

const days = (value: number | null) =>
  value === null ? "—" : value.toFixed(1);

export default function ItAnalytics({
  filters,
}: {
  filters: AnalyticsFilters;
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: analyticsQueryKey("it", filters),
    queryFn: () => fetchAnalytics("it", filters),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <AnalyticsSkeleton />;
  if (isError) {
    return (
      <DetailsLoadError
        message="The IT Requisition analytics could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const { totals } = data;
  const decided = totals.acceptedRequests + totals.declinedRequests;
  const pendingAt = (stage: ItStage) =>
    data.pipeline.find((row) => row.stage === stage)?.requests ?? 0;

  return (
    <div
      aria-busy={isPlaceholderData}
      className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
    >
      {/* Headline figures */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          Icon={Laptop}
          label="Requests submitted"
          value={formatCount(totals.requests)}
          detail={`${formatCount(totals.newHires)} new · ${formatCount(totals.replacements)} replacement`}
        />
        <StatTile
          Icon={CircleCheck}
          label="Accepted by IT"
          value={formatCount(totals.acceptedRequests)}
          detail={`${percent(totals.acceptedRequests, decided)} of decided · ${formatCount(totals.completed)} completed`}
        />
        <StatTile
          Icon={Hourglass}
          label="Awaiting approval"
          value={formatCount(totals.pendingRequests)}
          detail={`${formatCount(pendingAt("hod"))} at HOD · ${formatCount(pendingAt("it"))} at IT`}
        />
        <StatTile
          Icon={CircleX}
          label="Declined or rejected"
          value={formatCount(totals.declinedRequests)}
          detail={`${percent(totals.declinedRequests, decided)} of decided requests`}
        />
        <StatTile
          Icon={CalendarClock}
          label="Accepted before joining"
          value={percent(totals.acceptedBeforeJoining, totals.acceptedRequests)}
          detail={`of accepted requests · ${days(totals.avgNoticeDays)} days' notice on average`}
        />
        <StatTile
          Icon={Timer}
          label="Average days to IT decision"
          value={days(totals.avgDaysToItDecision)}
          detail="From submission to IT accepting or rejecting"
        />
      </div>

      {/* Trend */}
      <ChartCard
        title="Requests by month"
        subtitle="By submission month: everything requested, and what IT has accepted"
        legend={[
          { label: "Requested", color: SERIES.requested },
          { label: "Accepted", color: SERIES.approved },
        ]}
        isEmpty={totals.requests === 0}
        table={{
          columns: ["Month", "Requested", "Accepted"],
          rows: data.monthly.map((row) => [
            formatMonth(row.month),
            row.requested,
            row.accepted,
          ]),
        }}
      >
        <MonthlyBars
          data={data.monthly}
          series={[
            { key: "requested", label: "Requested", color: SERIES.requested },
            { key: "accepted", label: "Accepted", color: SERIES.approved },
          ]}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {!filters.department && (
          <ChartCard
            className="lg:col-span-2"
            title="Requests by department"
            subtitle="Accepted by IT, and still awaiting approval"
            legend={[
              { label: "Accepted", color: SERIES.approved },
              { label: "Awaiting approval", color: SERIES.pending },
            ]}
            isEmpty={data.byDepartment.length === 0}
            table={{
              columns: ["Department", "Accepted", "Awaiting approval"],
              rows: data.byDepartment.map((row) => [
                row.department,
                row.accepted,
                row.pending,
              ]),
            }}
          >
            <DepartmentBars
              data={data.byDepartment}
              series={[
                { key: "accepted", label: "Accepted", color: SERIES.approved },
                {
                  key: "pending",
                  label: "Awaiting approval",
                  color: SERIES.pending,
                },
              ]}
            />
          </ChartCard>
        )}

        <ChartCard
          title="Most requested items"
          subtitle="Equipment and access on accepted requests"
          isEmpty={data.requirementItems.length === 0}
          emptyText="No accepted requests for these filters"
          table={{
            columns: ["Item", "Requests", "Share"],
            rows: data.requirementItems.map((row) => [
              row.item,
              row.requests,
              percent(row.requests, totals.acceptedRequests),
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.requirementItems.map((row) => ({
              label: row.item,
              value: row.requests,
              detail: percent(row.requests, totals.acceptedRequests),
            }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-4">
          <ChartCard
            title="Accepted: new or replacement"
            subtitle="New starters versus replacing an existing setup"
            isEmpty={data.replacementOrNew.length === 0}
            emptyText="No accepted requests for these filters"
            table={{
              columns: ["Type", "Requests", "Share"],
              rows: data.replacementOrNew.map((row) => [
                row.kind,
                row.requests,
                percent(row.requests, totals.acceptedRequests),
              ]),
            }}
          >
            <BarList
              color={SERIES.approved}
              items={data.replacementOrNew.map((row) => ({
                label: row.kind,
                value: row.requests,
                detail: percent(row.requests, totals.acceptedRequests),
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Completion of accepted requests"
            subtitle="Marked completed by the scheduled completion run"
            isEmpty={totals.acceptedRequests === 0}
            emptyText="No accepted requests for these filters"
            table={{
              columns: ["Status", "Requests"],
              rows: [
                ["Completed", totals.completed],
                [
                  "Awaiting completion",
                  totals.acceptedRequests - totals.completed,
                ],
              ],
            }}
          >
            <BarList
              color={SERIES.approved}
              items={[
                { label: "Completed", value: totals.completed },
                {
                  label: "Awaiting completion",
                  value: totals.acceptedRequests - totals.completed,
                },
              ].map((row) => ({
                ...row,
                detail: percent(row.value, totals.acceptedRequests),
              }))}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Awaiting approval, by stage"
          subtitle="Requests in progress and the stage each waits on"
          isEmpty={data.pipeline.length === 0}
          emptyText="Nothing is awaiting approval"
          table={{
            columns: ["Stage", "Requests"],
            rows: data.pipeline.map((row) => [
              STAGE_LABELS[row.stage],
              row.requests,
            ]),
          }}
        >
          <BarList
            color={SERIES.pending}
            items={data.pipeline.map((row) => ({
              label: STAGE_LABELS[row.stage],
              value: row.requests,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Declines, by stage"
          subtitle="Declined by the HOD, or rejected by IT"
          isEmpty={data.declines.length === 0}
          emptyText="No declined or rejected requests for these filters"
          table={{
            columns: ["Stage", "Requests"],
            rows: data.declines.map((row) => [
              STAGE_LABELS[row.stage],
              row.requests,
            ]),
          }}
        >
          <BarList
            color={SERIES.declined}
            items={data.declines.map((row) => ({
              label: STAGE_LABELS[row.stage],
              value: row.requests,
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
