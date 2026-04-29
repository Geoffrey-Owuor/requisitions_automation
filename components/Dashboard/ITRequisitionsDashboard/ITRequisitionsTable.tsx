"use client";
import { useState, useMemo } from "react";
import { SkeletonTable } from "@/components/Skeletons/SkeletonTable";
import { getITRequisitionData } from "@/serverActions/GetITRequisitionData";
import { Search, Monitor, Plus, Info, RotateCcw } from "lucide-react";
import { TablePagination } from "../TablePagination";
import { ITRequisitionModal } from "./ITRequisitionsModal";
import StatusFormatter from "../StatusFormatter";
import { useQuery } from "@tanstack/react-query";
import { QueryResultRow } from "pg";
import ITDataExport from "./ITDataExport";
import Link from "next/link";

export default function ITRequisitionsTable({
  userEmail,
  isITAdmin,
}: {
  userEmail?: string;
  isITAdmin: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<QueryResultRow | null>(
    null,
  );
  const itemsPerPage = 6;

  const {
    data: initialData = [],
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: ["ITRequisitionsData", userEmail],
    queryFn: () => getITRequisitionData(userEmail),
  });

  const filteredData = useMemo(() => {
    if (!searchTerm) return initialData;
    return initialData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, initialData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (loading) return <SkeletonTable />;

  return (
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-gray-300 bg-white/60 py-2.5 pr-4 pl-12 text-sm shadow-[0_8px_16px_rgba(60,100,160,0.02)] outline-hidden backdrop-blur-xl transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </button>
        {isITAdmin && <ITDataExport />}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/50 shadow-[0_24px_48px_rgba(160,60,60,0.08)] backdrop-blur-2xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200/50 bg-neutral-100/30">
              {[
                "Employee",
                "Department",
                "Type",
                "HOD",
                "Requisition Date",
                "HOD Status",
                "IT Status",
                "Completion",
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
            {filteredData.length > 0 ? (
              paginatedData.map((req) => (
                <tr
                  key={req.request_id}
                  onClick={() => setSelectedRequest(req)}
                  className="group cursor-pointer transition-colors hover:bg-gray-200/30"
                >
                  {/* Employee */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#1e1b1b]">
                        {req.employee_name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        #{req.employee_staff_number}
                      </span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#1e1b1b]">
                      {req.employee_department}
                    </span>
                  </td>

                  {/* Replacement / New */}
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        req.replacement_new === "New"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {req.replacement_new}
                    </span>
                  </td>

                  {/* Requirements */}
                  <td className="max-w-50 px-6 py-5">
                    <span className="text-sm text-[#1e1b1b]">
                      {req.hod_approver_name}
                    </span>
                  </td>

                  {/* Requisition Date */}
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#a18080]">
                      {new Date(req.requisition_date).toLocaleDateString()}
                    </span>
                  </td>

                  {/* HOD Status */}
                  <td className="px-6 py-5">
                    <StatusFormatter status={req.hod_approver_status} />
                  </td>

                  {/* IT Status */}
                  <td className="px-6 py-5">
                    <StatusFormatter status={req.it_approver_status} />
                  </td>

                  {/* Completion */}
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <StatusFormatter status={req.completion_status} />
                      <Info
                        size={14}
                        className="text-red-200 transition-colors group-hover:text-red-400"
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              /* Fallback UI */
              <tr>
                <td colSpan={8} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 text-red-300 shadow-[0_8px_16px_rgba(60,100,160,0.05)] backdrop-blur-md">
                      <Monitor size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-[#1e1b1b]">
                      {searchTerm ? "No matches found" : "No requisitions yet"}
                    </h3>
                    <p className="mt-1 max-w-60 text-[13px] leading-relaxed text-[#a18080]">
                      {searchTerm
                        ? `We couldn't find anything matching "${searchTerm}". Try a different term.`
                        : "Your IT requisition history is currently empty."}
                    </p>

                    {/* Only show new requisition link when email prop is available and no search term */}
                    {!searchTerm && userEmail && (
                      <Link
                        href="/dashboard/itrequisition"
                        className="my-2 flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Requisition</span>
                      </Link>
                    )}

                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
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

      {/* Pagination */}
      <TablePagination
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Details Modal */}
      <ITRequisitionModal
        isOpen={!!selectedRequest}
        data={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
