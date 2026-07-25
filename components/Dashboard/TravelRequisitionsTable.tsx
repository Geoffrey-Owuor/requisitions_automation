"use client";
import { useState, useMemo } from "react";
import {
  getTravelRequisitionData,
  TravelRequisitionDataProps,
} from "@/serverActions/GetTravelRequisitionData";
import {
  Search,
  PlaneLanding,
  Info,
  Plus,
  RotateCcw,
  X,
  BriefcaseBusiness,
} from "lucide-react";
import { TablePagination } from "./TablePagination";
import { TravelDetailsModal } from "./TravelDetailsModal";
import StatusFormatter from "./StatusFormatter";
import { QueryResultRow } from "pg";
import { useQuery } from "@tanstack/react-query";
import { useToggleStore } from "@/store/useToggleStore";
import { SkeletonTable } from "../Skeletons/SkeletonTable";

export default function TravelRequisitionsTable({
  dataFlag,
  userEmail,
  hodEmail,
}: TravelRequisitionDataProps) {
  // Zustand store
  const setShowTravelRequisition = useToggleStore(
    (state) => state.setShowTravelRequisition,
  );

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
    queryKey: ["TravelRequisitionsData", { dataFlag, userEmail, hodEmail }],
    queryFn: () => getTravelRequisitionData({ dataFlag, userEmail, hodEmail }),
  });

  // 1. Shallow Search Logic using useMemo
  const filteredData = useMemo(() => {
    if (!searchTerm) return initialData;

    return initialData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, initialData]);

  // 2. Pagination Logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Render different titles based on the data flag
  const baseTitle = "Travel Requisitions";

  const dynamicTitles: Record<typeof dataFlag, string> = {
    userData: `Your Submitted ${baseTitle}`,
    hodPending: `${baseTitle} Pending Your Approval (HOD)`,
    hrPending: `${baseTitle} Pending Your Approval (HR)`,
    directorPending: `${baseTitle} Pending Your Approval (Director)`,
  };

  if (loading) return <SkeletonTable />;

  return (
    <>
      {(userEmail || initialData.length > 0) && (
        <div>
          <span className="mb-4 flex items-center gap-2 font-medium text-neutral-600">
            <BriefcaseBusiness className="h-5 w-5" />
            {dynamicTitles[dataFlag]}
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white/60 px-3 py-2.5 pr-4 pl-12 text-sm shadow-[0_8px_16px_rgba(60,100,160,0.02)] outline-hidden backdrop-blur-xl transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
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
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/50 shadow-[0_24px_48px_rgba(160,60,60,0.08)] backdrop-blur-2xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rose-100/50 bg-rose-50/30">
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Destination
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Mode
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Total Cost
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      HOD Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      HR Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-rose-400 uppercase">
                      Director Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {filteredData.length > 0 ? (
                    paginatedData.map((req) => (
                      <tr
                        key={req.request_id}
                        onClick={() => setSelectedRequest(req)}
                        className="group cursor-pointer transition-colors hover:bg-rose-50/50"
                      >
                        <td className="px-6 py-5">
                          <span className="text-sm text-[#1e1b1b]">
                            {req.employee_name}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-[#1e1b1b]">
                            {req.travel_destination}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col text-[12px] font-medium text-[#a18080]">
                            <span>
                              {new Date(
                                req.travel_departure_date,
                              ).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(
                                req.travel_return_date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-[#1e1b1b]">
                            {req.travel_mode}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold">
                            KES {req.travel_total_cost}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <StatusFormatter
                            status={req.travel_hod_approval_status}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <StatusFormatter
                            status={req.travel_hr_approval_status}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-between gap-4">
                            <StatusFormatter
                              status={req.travel_director_approval_status}
                            />
                            <Info
                              size={14}
                              className="text-rose-200 transition-colors group-hover:text-rose-400"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* --- FALLBACK UI --- */
                    <tr>
                      <td colSpan={8} className="px-6 py-20">
                        <div className="flex flex-col items-center justify-center text-center">
                          {/* Glassmorphic Icon Circle */}
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 text-rose-300 shadow-[0_8px_16px_rgba(160,60,60,0.05)] backdrop-blur-md">
                            <PlaneLanding size={32} strokeWidth={1.5} />
                          </div>

                          <h3 className="text-base font-semibold text-[#1e1b1b]">
                            {searchTerm
                              ? "No matches found"
                              : "No requisitions yet"}
                          </h3>
                          <p className="mt-1 max-w-60 text-[13px] leading-relaxed text-[#a18080]">
                            {searchTerm
                              ? `We couldn't find anything matching "${searchTerm}". Try a different term.`
                              : "Your travel requisition history is currently empty."}
                          </p>

                          {/* New Requisition Link, when returned data is empty */}
                          {!searchTerm && (
                            <button
                              onClick={() => setShowTravelRequisition(true)}
                              className="my-2 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                            >
                              <Plus className="h-4 w-4" />
                              <span>New Requisition</span>
                            </button>
                          )}

                          {/* Optional Action Button for Search Fallback */}
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="mt-5 text-[12px] font-bold tracking-wider text-rose-600 uppercase transition-colors hover:text-rose-700"
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
            <TravelDetailsModal
              isOpen={!!selectedRequest}
              data={selectedRequest}
              dataFlag={dataFlag}
              onClose={() => setSelectedRequest(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
