import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TableCollapseState {
  // Keyed by DASHBOARD_TABLES key (lib/dashboardTables.tsx, e.g.
  // "travel-userData"). Absent key = expanded. A collapsed table doesn't
  // fetch until it's expanded.
  collapsed: Record<string, boolean>;
  toggle: (tableKey: string) => void;
  setCollapsed: (tableKey: string, value: boolean) => void;
}

export const useTableCollapseStore = create<TableCollapseState>()(
  persist(
    (set) => ({
      collapsed: {},
      toggle: (tableKey) =>
        set((state) => ({
          collapsed: {
            ...state.collapsed,
            [tableKey]: !state.collapsed[tableKey],
          },
        })),
      setCollapsed: (tableKey, value) =>
        set((state) => ({
          collapsed: { ...state.collapsed, [tableKey]: value },
        })),
    }),
    { name: "Requisitions_Automation_tableCollapse" },
  ),
);
