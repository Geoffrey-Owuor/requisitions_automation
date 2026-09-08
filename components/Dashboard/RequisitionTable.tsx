"use client";
import { ReactNode, useEffect, useState } from "react";
import {
  Search,
  Plus,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { QueryResultRow } from "pg";
import { TablePagination } from "./TablePagination";
import { SkeletonTable } from "../Skeletons/SkeletonTable";
import { useServerPagination } from "@/hooks/useServerPagination";
import { useTableCollapseStore } from "@/store/useTableCollapseStore";
import { PaginatedResult } from "@/lib/pagination";

// Color tokens shared by a table's header row, hover state, empty state and
// search focus ring. Travel and IT each keep their existing look; new
// requisition types can reuse one of these or define their own.
export interface RequisitionTableTheme {
  headerRow: string;
  headerCell: string;
  bodyDivide: string;
  rowHover: string;
  tableShadow: string;
  searchFocus: string;
  emptyIconWrap: string;
  clearSearch: string;
}

export const ROSE_THEME: RequisitionTableTheme = {
  headerRow: "border-b border-rose-100/50 bg-rose-50/30",
  headerCell: "text-[11px] font-bold tracking-widest text-rose-400 uppercase",
  bodyDivide: "divide-y divide-rose-50",
  rowHover: "hover:bg-rose-50/50",
  tableShadow: "shadow-[0_24px_48px_rgba(160,60,60,0.08)]",
  searchFocus: "focus:border-red-400 focus:ring-4 focus:ring-red-500/5",
  emptyIconWrap: "text-rose-300 shadow-[0_8px_16px_rgba(160,60,60,0.05)]",
  clearSearch: "text-rose-600 hover:text-rose-700",
};

export const NEUTRAL_THEME: RequisitionTableTheme = {
  headerRow: "border-b border-neutral-200/50 bg-neutral-100/30",
  headerCell:
    "text-[11px] font-bold tracking-widest text-neutral-500 uppercase",
  bodyDivide: "divide-y divide-red-50",
  rowHover: "hover:bg-gray-200/30",
  tableShadow: "shadow-[0_24px_48px_rgba(160,60,60,0.08)]",
  searchFocus: "focus:border-red-400 focus:ring-4 focus:ring-red-500/5",
  emptyIconWrap: "text-red-300 shadow-[0_8px_16px_rgba(60,100,160,0.05)]",
  clearSearch: "text-red-600 hover:text-red-700",
};

export const AMBER_THEME: RequisitionTableTheme = {
  headerRow: "border-b border-amber-100/50 bg-amber-50/30",
  headerCell: "text-[11px] font-bold tracking-widest text-amber-500 uppercase",
  bodyDivide: "divide-y divide-amber-50",
  rowHover: "hover:bg-amber-50/50",
  tableShadow: "shadow-[0_24px_48px_rgba(180,130,20,0.08)]",
  searchFocus: "focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5",
  emptyIconWrap: "text-amber-400 shadow-[0_8px_16px_rgba(180,130,20,0.05)]",
  clearSearch: "text-amber-600 hover:text-amber-700",
};

export const EMERALD_THEME: RequisitionTableTheme = {
  headerRow: "border-b border-emerald-100/50 bg-emerald-50/30",
  headerCell:
    "text-[11px] font-bold tracking-widest text-emerald-500 uppercase",
  bodyDivide: "divide-y divide-emerald-50",
  rowHover: "hover:bg-emerald-50/50",
  tableShadow: "shadow-[0_24px_48px_rgba(20,140,100,0.08)]",
  searchFocus: "focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5",
  emptyIconWrap: "text-emerald-400 shadow-[0_8px_16px_rgba(20,140,100,0.05)]",
  clearSearch: "text-emerald-600 hover:text-emerald-700",
};

export const VIOLET_THEME: RequisitionTableTheme = {
  headerRow: "border-b border-violet-100/50 bg-violet-50/30",
  headerCell: "text-[11px] font-bold tracking-widest text-violet-500 uppercase",
  bodyDivide: "divide-y divide-violet-50",
  rowHover: "hover:bg-violet-50/50",
  tableShadow: "shadow-[0_24px_48px_rgba(110,60,180,0.08)]",
  searchFocus: "focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5",
  emptyIconWrap: "text-violet-400 shadow-[0_8px_16px_rgba(110,60,180,0.05)]",
  clearSearch: "text-violet-600 hover:text-violet-700",
};

interface Column {
  key: string;
  label: string;
}

interface EmptyStateConfig {
  Icon: LucideIcon;
  // Shown when the table has no rows and no search filter is active.
  // heading defaults to "No requisitions yet" — override only if a type
  // needs different wording.
  heading?: string;
  body: string;
  newRequisitionLabel?: string;
  onNewRequisition?: () => void;
}

interface RequisitionTableProps<TParams> {
  // Identity used for collapse state and (by convention) the caller's own
  // onStatusChange/tableStatus bookkeeping — pass the same string used there.
  tableKey: string;
  title: string;
  Icon: LucideIcon;
  theme?: RequisitionTableTheme;
  searchPlaceholder: string;
  columns: Column[];
  renderRow: (row: QueryResultRow) => ReactNode;
  emptyState: EmptyStateConfig;
  // Extra toolbar control shown next to Search/Refresh, e.g. ITDataExport
  // for the itAll table.
  toolbarSlot?: ReactNode;
  queryKey: unknown[];
  params: TParams;
  queryFn: (args: {
    params: TParams;
    page: number;
    pageSize: number;
    searchTerm: string;
  }) => Promise<PaginatedResult<QueryResultRow>>;
  onStatusChange?: (hasData: boolean) => void;
  renderModal: (row: QueryResultRow | null, close: () => void) => ReactNode;
}

export default function RequisitionTable<TParams>({
  tableKey,
  title,
  Icon,
  theme = ROSE_THEME,
  searchPlaceholder,
  columns,
  renderRow,
  emptyState,
  toolbarSlot,
  queryKey,
  params,
  queryFn,
  onStatusChange,
  renderModal,
}: RequisitionTableProps<TParams>) {
  const [selectedRequest, setSelectedRequest] = useState<QueryResultRow | null>(
    null,
  );
  // Sticky "does this dataFlag have any data at all" signal — distinct from
  // totalCount, which reflects the current (possibly search-filtered) count.
  const [hasData, setHasData] = useState(false);
  const [committedTotalCount, setCommittedTotalCount] = useState<number | null>(
    null,
  );

  const collapsed = useTableCollapseStore(
    (state) => state.collapsed[tableKey] ?? false,
  );
  const toggleCollapsed = useTableCollapseStore((state) => state.toggle);

  const {
    data: paginatedData,
    totalCount,
    isLoading: loading,
    isFetching,
    refetch,
    searchTerm,
    setSearchTerm,
    clearSearch,
    isSearchActive,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useServerPagination({ queryKey, params, queryFn });

  // Commit the sticky "has any data" signal during render (not in an effect)
  // whenever an unfiltered totalCount becomes available — only trust
  // totalCount while no search filter is active, since a search can
  // legitimately drop totalCount to 0 without the table being truly empty.
  const canCommit = !loading && !isSearchActive;
  if (canCommit && totalCount !== committedTotalCount) {
    setCommittedTotalCount(totalCount);
    setHasData(totalCount > 0);
  }

  // Notifying the parent is a side effect on an external system, so it
  // belongs in an effect rather than during render.
  useEffect(() => {
    if (canCommit) onStatusChange?.(totalCount > 0);
  }, [canCommit, totalCount, onStatusChange]);

  if (loading) return <SkeletonTable />;

  if (!hasData) return null;

  return (
    <>
      <div
        id={`table-${tableKey}`}
        className="scroll-mt-4 rounded-xl border border-neutral-300 p-3"
      >
        <button
          type="button"
          onClick={() => toggleCollapsed(tableKey)}
          aria-expanded={!collapsed}
          className="mb-4 flex w-full items-center gap-2 text-left font-medium text-neutral-600"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{title}</span>
          <div className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-200/70">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </div>
        </button>

        {!collapsed && (
          <div className="mt-2">
            {/* Search Input And Refresh */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search
                  className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-xl border border-gray-300 bg-white/60 px-3 py-2.5 pr-4 pl-12 text-sm shadow-[0_8px_16px_rgba(60,100,160,0.02)] outline-hidden backdrop-blur-xl transition-all ${theme.searchFocus}`}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full p-1 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </button>
              {toolbarSlot}
            </div>

            {/* Table Container */}
            <div
              className={`overflow-x-auto rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-2xl transition-opacity ${theme.tableShadow} ${isFetching ? "animate-pulse opacity-60" : ""}`}
            >
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className={theme.headerRow}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-6 py-4 ${theme.headerCell}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={theme.bodyDivide}>
                  {totalCount > 0 ? (
                    paginatedData.map((req) => (
                      <tr
                        key={req.request_id}
                        onClick={() => setSelectedRequest(req)}
                        className={`group cursor-pointer transition-colors ${theme.rowHover}`}
                      >
                        {renderRow(req)}
                      </tr>
                    ))
                  ) : (
                    /* --- FALLBACK UI --- */
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-20">
                        <div className="flex flex-col items-center justify-center text-center">
                          {/* Glassmorphic Icon Circle */}
                          <div
                            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 backdrop-blur-md ${theme.emptyIconWrap}`}
                          >
                            <emptyState.Icon size={32} strokeWidth={1.5} />
                          </div>

                          <h3 className="text-base font-semibold text-[#1e1b1b]">
                            {searchTerm
                              ? "No matches found"
                              : (emptyState.heading ?? "No requisitions yet")}
                          </h3>
                          <p className="mt-1 max-w-60 text-[13px] leading-relaxed text-[#a18080]">
                            {searchTerm
                              ? `We couldn't find anything matching "${searchTerm}". Try a different term.`
                              : emptyState.body}
                          </p>

                          {/* New Requisition Link, when returned data is empty */}
                          {!searchTerm && emptyState.onNewRequisition && (
                            <button
                              onClick={emptyState.onNewRequisition}
                              className="my-2 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                            >
                              <Plus className="h-4 w-4" />
                              <span>
                                {emptyState.newRequisitionLabel ??
                                  "New Requisition"}
                              </span>
                            </button>
                          )}

                          {/* Optional Action Button for Search Fallback */}
                          {searchTerm && (
                            <button
                              onClick={clearSearch}
                              className={`mt-5 text-[12px] font-bold tracking-wider uppercase transition-colors ${theme.clearSearch}`}
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <TablePagination
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {renderModal(selectedRequest, () => setSelectedRequest(null))}
      </div>
    </>
  );
}
