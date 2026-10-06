"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useToggleStore } from "@/store/useToggleStore";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import {
  DASHBOARD_TABS,
  REQUISITION_TYPES,
  getRequisitionType,
  getVisibleTables,
  type DashboardTab,
  type DashboardTableEntry,
} from "@/lib/dashboardTables";
import DashboardWatermark from "../Modules/DashboardWaterMark";
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

  // Same modal toggles the sidebar and the "Mine" empty state use
  const openForm = useToggleStore(
    (state) =>
      ({
        travel: state.setShowTravelRequisition,
        it: state.setShowITRequisition,
        access: state.setShowAccessRequisition,
        casual: state.setShowCasualRequisition,
        employee: state.setShowEmployeeRequisition,
      })[type],
  );

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

  return (
    <div className="relative h-full p-2">
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center overflow-hidden lg:left-[calc(80px+(100vw-80px)/2)]">
        <DashboardWatermark />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Requisition type switcher — keeps the current tab where the
            target type has it, otherwise the page falls back to "mine" */}
        <nav
          aria-label="Requisition types"
          className="flex flex-wrap items-center gap-1.5"
        >
          {REQUISITION_TYPES.map((entry) => {
            const isActive = entry.type === type;
            return (
              <Link
                key={entry.type}
                href={`${entry.href}?tab=${activeTab}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-neutral-300 bg-white/60 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                <entry.Icon className="h-3.5 w-3.5" />
                {entry.label}
              </Link>
            );
          })}
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
            <Icon className="h-5 w-5 text-neutral-500" />
            {label} Requisitions
          </h1>
          <button
            onClick={() => openForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New {label} Requisition
          </button>
        </div>

        {/* Tabs — hidden when the viewer only has their own submissions */}
        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label={`${label} requisition views`}
            className="flex w-fit gap-1 rounded-xl border border-neutral-300 bg-white/60 p-1"
          >
            {tabs.map(({ tab, label: tabLabel }) => {
              const isActive = tab === activeTab;
              return (
                <Link
                  key={tab}
                  href={`${href}?tab=${tab}`}
                  replace
                  scroll={false}
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900"
                  }`}
                >
                  {tabLabel}
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
