import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TableCollapseState {
  // Keyed by the same tableKey strings used in UserDashboard's tableStatus
  // map (e.g. "travel-userData"). Absent key = expanded, so existing
  // dashboards default to today's fully-expanded behavior.
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
