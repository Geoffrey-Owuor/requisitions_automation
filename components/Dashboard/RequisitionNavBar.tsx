"use client";

import { useEffect, useRef } from "react";
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

// Sticky bar across a requisition type's area (its tables and its form
// pages): a type switcher with each type's pending-approval count, and the
// page's own action - "New" on the tables, back to them on a form.
// Opaque on purpose: backdrop-blur made the page scroll lag on 4K screens.
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

  // On narrow screens the type row scrolls sideways (its right edge fades
  // out to show there's more): bring the current type into view, again
  // whenever the row's width changes (late styles or fonts, rotation)
  const typesRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const types = typesRef.current;
    if (!types) return;
    const reveal = () => {
      const active = activeRef.current;
      if (!active) return;
      if (
        active.offsetLeft < types.scrollLeft ||
        active.offsetLeft + active.offsetWidth >
          types.scrollLeft + types.clientWidth
      ) {
        types.scrollLeft = active.offsetLeft - 8;
      }
    };
    const observer = new ResizeObserver(reveal);
    observer.observe(types);
    return () => observer.disconnect();
  }, [type]);

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-2">
        <nav
          ref={typesRef}
          aria-label="Requisition types"
          className="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-6 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%_-_1.5rem),transparent)]"
        >
          {REQUISITION_TYPES.map((entry) => {
            const isActive = entry.type === type;
            const count = pendingCount(entry.type);
            return (
              <Link
                key={entry.type}
                ref={isActive ? activeRef : undefined}
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
        </nav>

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
      </div>
    </div>
  );
};

export default RequisitionNavBar;
