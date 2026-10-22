"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CircleCheck,
  CircleX,
  Hourglass,
  Timer,
  UsersRound,
  Wallet,
} from "lucide-react";
import { analyticsQueryKey, fetchAnalytics } from "@/lib/analytics/api";
import type { AnalyticsFilters } from "@/lib/analytics/definitions";
import { EMPLOYEE_STAGE_SHORT_LABELS } from "@/lib/employeeApprovalOrder";
import {
  dateFormatter,
  formatJobGrade,
  parseSalaryRange,
} from "@/public/assets";
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
  formatMonth,
  percent,
} from "./AnalyticsPrimitives";
import { DepartmentBars, MonthlyBars } from "./Charts";

export default function EmployeeAnalytics({
  filters,
}: {
  filters: AnalyticsFilters;
}) {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: analyticsQueryKey("employee", filters),
    queryFn: () => fetchAnalytics("employee", filters),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <AnalyticsSkeleton />;
  if (isError) {
    return (
      <DetailsLoadError
        message="The Employee Requisition analytics could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const { totals } = data;
  const decided = totals.approvedRequisitions + totals.declinedRequisitions;
  const showDepartments = !filters.department;

  return (
    <div
      aria-busy={isPlaceholderData}
      className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
    >
      {/* Headline figures */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          Icon={UsersRound}
          label="Headcount requested"
          value={formatCount(totals.headcountRequested)}
          detail={`Across ${formatCount(totals.requisitions)} requisition${totals.requisitions === 1 ? "" : "s"}`}
        />
        <StatTile
          Icon={CircleCheck}
          label="Headcount approved"
          value={formatCount(totals.approvedHeadcount)}
          detail={`${formatCount(totals.approvedRequisitions)} requisition${totals.approvedRequisitions === 1 ? "" : "s"} fully approved`}
        />
        <StatTile
          Icon={Hourglass}
          label="Headcount awaiting approval"
          value={formatCount(totals.pendingHeadcount)}
          detail={`${formatCount(totals.pendingRequisitions)} requisition${totals.pendingRequisitions === 1 ? "" : "s"} in progress`}
        />
        <StatTile
          Icon={CircleX}
          label="Requisitions declined"
          value={formatCount(totals.declinedRequisitions)}
          detail={`${percent(totals.declinedRequisitions, decided)} of decided requisitions`}
        />
        <StatTile
          Icon={Timer}
          label="Average days to decision"
          value={
            totals.avgDaysToDecision === null
              ? "—"
              : totals.avgDaysToDecision.toFixed(1)
          }
          detail="From submission to final approval or decline"
        />
        <StatTile
          Icon={Wallet}
          label="Approved monthly salaries"
          value={
            totals.approvedHeadcount === 0
              ? "—"
              : `${formatKes(totals.approvedSalaryMin)} – ${formatCompact(totals.approvedSalaryMax)}`
          }
          detail={
            totals.unpricedApprovedPositions > 0
              ? `${totals.unpricedApprovedPositions} approved position(s) without a readable range`
              : "Salary range times headcount, approved positions"
          }
        />
      </div>

      {/* Trend */}
      <ChartCard
        title="Headcount by month"
        subtitle="By submission month: everything requested, and what has been fully approved"
        legend={[
          { label: "Requested", color: SERIES.requested },
          { label: "Approved", color: SERIES.approved },
        ]}
        isEmpty={totals.requisitions === 0}
        table={{
          columns: ["Month", "Requested", "Approved"],
          rows: data.monthly.map((row) => [
            formatMonth(row.month),
            row.requestedHeadcount,
            row.approvedHeadcount,
          ]),
        }}
      >
        <MonthlyBars
          data={data.monthly}
          series={[
            {
              key: "requestedHeadcount",
              label: "Requested",
              color: SERIES.requested,
            },
            {
              key: "approvedHeadcount",
              label: "Approved",
              color: SERIES.approved,
            },
          ]}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {showDepartments && (
          <ChartCard
            className="lg:col-span-2"
            title="Headcount by department"
            subtitle="Approved, and still awaiting approval"
            legend={[
              { label: "Approved", color: SERIES.approved },
              { label: "Awaiting approval", color: SERIES.pending },
            ]}
            isEmpty={data.byDepartment.length === 0}
            table={{
              columns: ["Department", "Approved", "Awaiting approval"],
              rows: data.byDepartment.map((row) => [
                row.department,
                row.approvedHeadcount,
                row.pendingHeadcount,
              ]),
            }}
          >
            <DepartmentBars
              data={data.byDepartment}
              series={[
                {
                  key: "approvedHeadcount",
                  label: "Approved",
                  color: SERIES.approved,
                },
                {
                  key: "pendingHeadcount",
                  label: "Awaiting approval",
                  color: SERIES.pending,
                },
              ]}
            />
          </ChartCard>
        )}

        <ChartCard
          title="Approved headcount by job grade"
          subtitle="Grade and rank as submitted"
          isEmpty={data.byGrade.length === 0}
          emptyText="No approved positions for these filters"
          table={{
            columns: ["Job grade", "Headcount"],
            rows: data.byGrade.map((row) => [
              formatJobGrade(row.grade, row.rank),
              row.headcount,
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.byGrade.map((row) => ({
              label: formatJobGrade(row.grade, row.rank),
              value: row.headcount,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Approved headcount: new or replacement"
          subtitle="Growth versus backfilling existing roles"
          isEmpty={data.replacementOrNew.length === 0}
          emptyText="No approved positions for these filters"
          table={{
            columns: ["Position type", "Headcount", "Share"],
            rows: data.replacementOrNew.map((row) => [
              row.kind,
              row.headcount,
              percent(row.headcount, totals.approvedHeadcount),
            ]),
          }}
        >
          <BarList
            color={SERIES.approved}
            items={data.replacementOrNew.map((row) => ({
              label: row.kind,
              value: row.headcount,
              detail: percent(row.headcount, totals.approvedHeadcount),
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Awaiting approval, by stage"
          subtitle="Requisitions in progress and the stage each waits on"
          isEmpty={data.pipeline.length === 0}
          emptyText="Nothing is awaiting approval"
          table={{
            columns: ["Stage", "Requisitions", "Headcount"],
            rows: data.pipeline.map((row) => [
              EMPLOYEE_STAGE_SHORT_LABELS[row.stage],
              row.requisitions,
              row.headcount,
            ]),
          }}
        >
          <BarList
            color={SERIES.pending}
            items={data.pipeline.map((row) => ({
              label: EMPLOYEE_STAGE_SHORT_LABELS[row.stage],
              value: row.requisitions,
              detail: `(${formatCount(row.headcount)} headcount)`,
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
              EMPLOYEE_STAGE_SHORT_LABELS[row.stage],
              row.requisitions,
            ]),
          }}
        >
          <BarList
            color={SERIES.declined}
            items={data.declines.map((row) => ({
              label: EMPLOYEE_STAGE_SHORT_LABELS[row.stage],
              value: row.requisitions,
            }))}
          />
        </ChartCard>
      </div>

      <RecentApproved positions={data.recentApproved} />
    </div>
  );
}

function RecentApproved({
  positions,
}: {
  positions: {
    positionId: string;
    positionTitle: string;
    department: string;
    grade: string;
    rank: number | null;
    headcount: number;
    replacementOrNew: string;
    salaryRange: string;
    approvedOn: string;
  }[];
}) {
  return (
    <section
      aria-label="Recently approved positions"
      className="rounded-surface border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-neutral-900">
        Recently approved positions
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500">
        The latest final approvals among these requisitions
      </p>
      {positions.length === 0 ? (
        <p className="rounded-control mt-3 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
          No approved positions for these filters
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Position
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Department
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Job grade
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Headcount
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Salary range (KES)
                </th>
                <th scope="col" className="py-2 font-medium">
                  Approved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {positions.map((position) => (
                <tr key={position.positionId} className="text-neutral-700">
                  <td className="py-2 pr-3">
                    <span className="font-medium text-neutral-900">
                      {position.positionTitle}
                    </span>
                    <span className="ml-1.5 text-xs text-neutral-500">
                      {position.replacementOrNew}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{position.department}</td>
                  <td className="py-2 pr-3">
                    {formatJobGrade(position.grade, position.rank)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatCount(position.headcount)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {formatSalary(position.salaryRange)}
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    {dateFormatter(position.approvedOn)}
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

// "50000 - 100000" -> "50,000 – 100,000"; anything unreadable as stored
function formatSalary(value: string) {
  const range = parseSalaryRange(value);
  return range
    ? `${formatCount(range.min)} – ${formatCount(range.max)}`
    : value;
}
