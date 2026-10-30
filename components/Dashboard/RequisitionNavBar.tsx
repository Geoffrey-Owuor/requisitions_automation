"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import {
  REQUISITION_TYPES,
  getRequisitionType,
  getVisibleTables,
  myRequisitionsHref,
  newRequisitionHref,
} from "@/lib/dashboardTables";
import { ScrollingNav, StickyNavBar } from "./StickyNavBar";

// Sticky bar across a requisition type's area (its tables and its form
// pages): a type switcher with each type's pending-approval count, and the
// page's own action - "New" on the tables, back to them on a form.
const RequisitionNavBar = ({
  type,
  mode,
  tab,
}: {
  type: DashboardRequisitionType;
  mode: "tables" | "form";
  // The tables page's tab, kept when switching type (the target page
  // falls back to "mine" if it doesn't have it)
  tab?: string;
}) => {
  const { roles, memberships } = useUser();
  const { label } = getRequisitionType(type);

  // Everything waiting in each type's pending queues
  const counts = useDashboardSummary().data?.counts;
  const pendingTables = getVisibleTables({ roles, memberships }).filter(
    (entry) => entry.tab === "pending",
  );
  const pendingCount = (entryType: DashboardRequisitionType) =>
    pendingTables
      .filter((entry) => entry.type === entryType)
      .reduce((sum, entry) => sum + (counts?.[entry.key] ?? 0), 0);

  return (
    <StickyNavBar>
      <ScrollingNav
        label="Requisition types"
        activeKey={type}
        className="gap-1"
      >
        {REQUISITION_TYPES.map((entry) => {
          const isActive = entry.type === type;
          const count = pendingCount(entry.type);
          return (
            <Link
              key={entry.type}
              href={
                mode === "tables" && tab
                  ? `${entry.href}?tab=${encodeURIComponent(tab)}`
                  : entry.href
              }
              aria-current={isActive ? "page" : undefined}
              className={`rounded-compact inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <entry.Icon className="h-3.5 w-3.5" />
              {entry.label}
              {count > 0 && (
                <span
                  className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white"
                  aria-label={`${count} awaiting your approval`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </ScrollingNav>

      {mode === "tables" ? (
        <Link
          href={newRequisitionHref(type)}
          className="rounded-control inline-flex shrink-0 items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          <span>
            New<span className="max-sm:hidden"> {label} Requisition</span>
          </span>
        </Link>
      ) : (
        <Link
          href={myRequisitionsHref(type)}
          className="rounded-control inline-flex shrink-0 items-center gap-1.5 border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            My<span className="max-sm:hidden"> {label}</span> Requisitions
          </span>
        </Link>
      )}
    </StickyNavBar>
  );
};

export default RequisitionNavBar;
