"use client";

import { DashboardTableEntry } from "@/lib/dashboardTables";
import { useTableCollapseStore } from "@/store/useTableCollapseStore";

/**
 * Sticky chip bar listing the tables currently rendered on the dashboard, so
 * a user with many tables doesn't have to scroll past ones they don't want.
 * Clicking a chip expands that table (if collapsed) and jumps to it
 * instantly — no smooth-scroll animation.
 *
 * Hidden below 3 tables: with only one or two, a jump list adds no value.
 */
export default function DashboardTableNav({
  items,
}: {
  items: DashboardTableEntry[];
}) {
  const setCollapsed = useTableCollapseStore((state) => state.setCollapsed);

  if (items.length < 3) return null;

  const goTo = (key: string) => {
    setCollapsed(key, false);
    document.getElementById(`table-${key}`)?.scrollIntoView({
      behavior: "instant",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Jump to table"
      className="sticky top-0 z-20 rounded-xl border border-rose-200 bg-white/70 p-2 backdrop-blur-xl"
    >
      <div className="small-scrollbar flex flex-row gap-1.5 overflow-x-auto">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => goTo(key)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-rose-700 transition-colors hover:bg-rose-50"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
