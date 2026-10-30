"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import {
  DASHBOARD_TABS,
  getRequisitionType,
  getVisibleTables,
  type DashboardTab,
  type DashboardTableEntry,
} from "@/lib/dashboardTables";
import DashboardWatermark from "../Modules/DashboardWaterMark";
import { preloadFormBanner } from "@/components/FormBanner";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import AccessRequisitionsTable from "./AccessRequisitionsDashboard/AccessRequisitionsTable";
import CasualRequisitionsTable from "./CasualRequisitionsDashboard/CasualRequisitionsTable";
import EmployeeRequisitionsTable from "./EmployeeRequisitionsDashboard/EmployeeRequisitionsTable";
import type { TravelRequisitionDataProps } from "@/serverActions/GetTravelRequisitionData";
import type { ITRequisitionDataProps } from "@/serverActions/GetITRequisitionData";
import type { AccessRequisitionDataProps } from "@/serverActions/GetAccessRequisitionData";
import type { CasualRequisitionDataProps } from "@/serverActions/GetCasualRequisitionData";
import type { EmployeeRequisitionDataProps } from "@/serverActions/GetEmployeeRequisitionData";

// The registry's dataFlag is a plain string; each table narrows it to its
// own loader's flag union (the GET route rejects anything else).
function DashboardTable({ entry }: { entry: DashboardTableEntry }) {
  switch (entry.type) {
    case "travel":
      return (
        <TravelRequisitionsTable
          dataFlag={entry.dataFlag as TravelRequisitionDataProps["dataFlag"]}
        />
      );
    case "it":
      return (
        <ITRequisitionsTable
          dataFlag={entry.dataFlag as ITRequisitionDataProps["dataFlag"]}
        />
      );
    case "access":
      return (
        <AccessRequisitionsTable
          dataFlag={entry.dataFlag as AccessRequisitionDataProps["dataFlag"]}
        />
      );
    case "casual":
      return (
        <CasualRequisitionsTable
          dataFlag={entry.dataFlag as CasualRequisitionDataProps["dataFlag"]}
        />
      );
    case "employee":
      return (
        <EmployeeRequisitionsTable
          dataFlag={entry.dataFlag as EmployeeRequisitionDataProps["dataFlag"]}
        />
      );
  }
}

const isDashboardTab = (value: string | undefined): value is DashboardTab =>
  DASHBOARD_TABS.some(({ tab }) => tab === value);

export default function RequisitionTypeDashboard({
  type,
  tab: requestedTab,
}: {
  type: DashboardRequisitionType;
  tab?: string;
}) {
  const { roles, memberships } = useUser();
  const { label, href, Icon } = getRequisitionType(type);
  // "New" is the likeliest next click, so have its banner ready
  preloadFormBanner(type);

  const tables = getVisibleTables({ roles, memberships }).filter(
    (entry) => entry.type === type,
  );
  // "mine" always has the user's own table; other tabs only appear when
  // the viewer holds a stage that feeds them.
  const tabs = DASHBOARD_TABS.filter(({ tab }) =>
    tables.some((entry) => entry.tab === tab),
  );
  const activeTab =
    isDashboardTab(requestedTab) && tabs.some(({ tab }) => tab === requestedTab)
      ? requestedTab
      : "mine";
  const activeTables = tables.filter((entry) => entry.tab === activeTab);

  // Badge on the Pending tab: everything waiting across this type's queues
  const counts = useDashboardSummary().data?.counts;
  const pendingCount = tables
    .filter((entry) => entry.tab === "pending")
    .reduce((sum, entry) => sum + (counts?.[entry.key] ?? 0), 0);

  return (
    <div className="relative p-2">
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center overflow-hidden lg:left-[calc(80px+(100vw-80px)/2)]">
        <DashboardWatermark />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header — the type switcher and "New" action are in the sticky
            RequisitionNavBar above */}
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <Icon className="h-5 w-5 text-neutral-500" />
          {label} Requisitions
        </h1>

        {/* Tabs — hidden when the viewer only has their own submissions */}
        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label={`${label} requisition views`}
            className="rounded-control flex gap-1 border border-neutral-300 bg-white/60 p-1 sm:w-fit"
          >
            {tabs.map(({ tab, label: tabLabel, shortLabel }) => {
              const isActive = tab === activeTab;
              return (
                <Link
                  key={tab}
                  href={`${href}?tab=${tab}`}
                  replace
                  scroll={false}
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-compact inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors max-sm:flex-1 ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900"
                  }`}
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="max-sm:hidden">{tabLabel}</span>
                  {tab === "pending" && pendingCount > 0 && (
                    <span className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Only the active tab's tables mount, so only they fetch */}
        <div role="tabpanel" className="space-y-4">
          {activeTables.map((entry) => (
            <DashboardTable key={entry.key} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
