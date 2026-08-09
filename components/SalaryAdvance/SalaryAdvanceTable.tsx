"use client";
import { useMemo, useState } from "react";
import { SkeletonTable } from "@/components/Skeletons/SkeletonTable";
import {
  Search,
  RotateCcw,
  X,
  Info,
  CircleDollarSign,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { TablePagination } from "../Dashboard/TablePagination";
import { SalaryAdvanceModal } from "./SalaryAdvanceModal";
import { SalaryAdvanceBatchModal } from "./SalaryAdvanceBatchModal";
import StatusFormatter from "../Dashboard/StatusFormatter";
import {
  GetSalaryAdvanceData,
  SalaryAdvanceData,
} from "@/serverActions/GetSalaryAdvanceData";
import { SalaryAdvanceExportModal } from "./SalaryAdvanceExportModal";
import { Checkbox } from "./Checkbox";
import { useServerPagination } from "@/hooks/useServerPagination";

export default function SalaryAdvanceTable() {
  const [selectedRequest, setSelectedRequest] =
    useState<SalaryAdvanceData | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState<
    "approved" | "declined" | null
  >(null);

  const {
    data: paginatedData,
    totalCount,
    isLoading: loading,
    isFetching,
    refetch,
    searchTerm,
    setSearchTerm,
    clearSearch,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useServerPagination({
    queryKey: ["SalaryAdvancesData"],
    params: {},
    queryFn: ({ page, pageSize, searchTerm }) =>
      GetSalaryAdvanceData({ page, pageSize, searchTerm }),
  });

  // Only pending requests are eligible for batch review
  const selectablePageIds = useMemo(
    () =>
      paginatedData
        .filter((req) => req.approval_status?.toLowerCase() === "pending")
        .map((req) => req.request_id),
    [paginatedData],
  );

  const isPageFullySelected =
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedIds.has(id));

  const toggleRowSelection = (requestId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  };

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isPageFullySelected) {
        selectablePageIds.forEach((id) => next.delete(id));
      } else {
        selectablePageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <span className="mb-4 flex items-center gap-2 font-medium text-neutral-700">
        <CircleDollarSign className="h-5 w-5" />
        Salary Advances Data
      </span>

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
              placeholder="Search employee, department or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/60 py-2.5 pr-4 pl-12 text-sm shadow-[0_8px_16px_rgba(60,100,160,0.02)] outline-hidden backdrop-blur-xl transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
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
            className="mr-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-xl border border-neutral-300 bg-neutral-200/50 p-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-neutral-200/80 hover:text-gray-900"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </button>

          {selectedIds.size > 0 && (
            <div className="ml-4 flex flex-wrap items-center gap-4">
              <span className="text-xs font-medium text-gray-500">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setBatchStatus("declined")}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-100"
              >
                <X className="h-4 w-4" />
                Batch Decline
              </button>
              <button
                onClick={() => setBatchStatus("approved")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-sm text-white transition-colors hover:bg-slate-900"
              >
                <Check className="h-4 w-4" />
                Batch Approve
              </button>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div
          className={`overflow-x-auto rounded-2xl border border-gray-200 bg-white/50 shadow-[0_24px_48px_rgba(160,60,60,0.08)] backdrop-blur-2xl transition-opacity ${isFetching ? "animate-pulse opacity-60" : ""}`}
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200/50 bg-neutral-100/30">
                <th className="w-10 px-6 py-4">
                  <Checkbox
                    checked={isPageFullySelected}
                    disabled={selectablePageIds.length === 0}
                    onChange={togglePageSelection}
                  />
                </th>
                {[
                  "Employee",
                  "Department",
                  "Amount",
                  "Installments",
                  "Type",
                  "Date Submitted",
                  "Status",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-[11px] font-bold tracking-widest text-neutral-500 uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {totalCount > 0 ? (
                paginatedData.map((req, idx) => {
                  const isPending =
                    req.approval_status?.toLowerCase() === "pending";
                  return (
                    <tr
                      key={`${req.staff_number}-${idx}`} // Assuming combo key if no ID
                      onClick={() => setSelectedRequest(req)}
                      className="group cursor-pointer transition-colors hover:bg-gray-200/30"
                    >
                      {/* Select */}
                      <td
                        className="px-6 py-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending && (
                          <Checkbox
                            checked={selectedIds.has(req.request_id)}
                            onChange={() => toggleRowSelection(req.request_id)}
                          />
                        )}
                      </td>

                      {/* Employee */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#1e1b1b]">
                            {req.staff_name}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            #{req.staff_number}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#1e1b1b]">
                          {req.staff_department}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-[#1e1b1b]">
                          {Number(req.request_amount).toLocaleString()}
                        </span>
                      </td>

                      {/* Installments */}
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#1e1b1b]">
                          {req.no_of_installments}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center rounded-full ${req.request_type === "oneoff" ? "bg-slate-100 text-slate-700" : "bg-cyan-100 text-cyan-700"} px-2.5 py-0.5 text-[11px] font-semibold capitalize`}
                        >
                          {req.request_type}
                        </span>
                      </td>

                      {/* Requisition Date */}
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#a18080]">
                          {new Date(
                            req.request_created_at,
                          ).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-between gap-4">
                          <StatusFormatter status={req.approval_status} />
                          <Info
                            size={14}
                            className={`${
                              req.approval_status === "approved"
                                ? "text-emerald-200 group-hover:text-emerald-400"
                                : req.approval_status === "declined"
                                  ? "text-red-200 group-hover:text-red-400"
                                  : "text-amber-200 group-hover:text-amber-400"
                            } transition-colors`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Fallback UI */
                <tr>
                  <td colSpan={8} className="px-6 py-20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 text-red-300 shadow-[0_8px_16px_rgba(60,100,160,0.05)] backdrop-blur-md">
                        <CircleDollarSign size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-base font-semibold text-[#1e1b1b]">
                        {searchTerm
                          ? "No matches found"
                          : "No requisitions yet"}
                      </h3>
                      <p className="mt-1 max-w-60 text-[13px] leading-relaxed text-[#a18080]">
                        {searchTerm
                          ? `We couldn't find anything matching "${searchTerm}". Try a different term.`
                          : "There are currently no salary advance requests to display."}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={clearSearch}
                          className="mt-5 text-[12px] font-bold tracking-wider text-red-600 uppercase transition-colors hover:text-red-700"
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

        {/* Export Modal */}
        {/* ADD THE EXPORT MODAL HERE */}
        <SalaryAdvanceExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />

        {/* Pagination */}
        <TablePagination
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />

        {/* Details & Review Modal */}
        <SalaryAdvanceModal
          isOpen={!!selectedRequest}
          data={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => refetch()}
        />

        {/* Batch Approve/Decline Modal */}
        <SalaryAdvanceBatchModal
          isOpen={batchStatus !== null}
          status={batchStatus}
          requestIds={Array.from(selectedIds)}
          onClose={() => setBatchStatus(null)}
          onSuccess={() => {
            setSelectedIds(new Set());
            refetch();
          }}
        />
      </div>
    </div>
  );
}
