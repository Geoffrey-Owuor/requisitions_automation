"use client";
import { useState, useMemo, useEffect } from "react";
import { getTravelRequisitionData } from "@/serverActions/GetTravelRequisitionData";
import { Search, PlaneLanding, PlaneTakeoff, Info } from "lucide-react";
import { SkeletonTable } from "../Skeletons.tsx/SkeletonTabel";
import { TablePagination } from "./TablePagination";
import { TravelDetailsModal } from "./TravelDetailsModal";
import StatusFormatter from "./StatusFormatter";
import { QueryResultRow } from "pg";

export default function TravelRquisitionsTable({
  userEmail,
}: {
  userEmail?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<QueryResultRow | null>(
    null,
  );
  const [initialData, setInitialData] = useState<QueryResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const fetchedData = await getTravelRequisitionData(userEmail);
        setInitialData(fetchedData);
      } catch (error) {
        console.error("Error fetching travel requisition data", error);
        setInitialData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

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

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="mt-2">
      {/* Search Input */}
      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute top-1/2 left-4 -translate-y-1/2 text-rose-300"
          size={18}
        />
        <input
          type="text"
          placeholder="Search destination, employee or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-gray-300 bg-white/60 py-3 pr-4 pl-12 text-sm shadow-[0_8px_16px_rgba(160,60,60,0.02)] outline-hidden backdrop-blur-xl transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white/50 shadow-[0_24px_48px_rgba(160,60,60,0.08)] backdrop-blur-2xl">
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
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-rose-500 shadow-sm">
                        <PlaneLanding size={16} />
                      </div>
                      <span className="text-sm text-[#1e1b1b]">
                        {req.travel_destination}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-[12px] font-medium text-[#a18080]">
                      <span className="flex items-center gap-1">
                        <PlaneTakeoff size={10} />{" "}
                        {new Date(
                          req.travel_departure_date,
                        ).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(req.travel_return_date).toLocaleDateString()}
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
                    <StatusFormatter status={req.travel_hod_approval_status} />
                  </td>
                  <td className="px-6 py-5">
                    <StatusFormatter status={req.travel_hod_approval_status} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-between">
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
                <td colSpan={5} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-center">
                    {/* Glassmorphic Icon Circle */}
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 text-rose-300 shadow-[0_8px_16px_rgba(160,60,60,0.05)] backdrop-blur-md">
                      <PlaneLanding size={32} strokeWidth={1.5} />
                    </div>

                    <h3 className="text-base font-semibold text-[#1e1b1b]">
                      {searchTerm ? "No matches found" : "No requisitions yet"}
                    </h3>
                    <p className="mt-1 max-w-60 text-[13px] leading-relaxed text-[#a18080]">
                      {searchTerm
                        ? `We couldn't find anything matching "${searchTerm}". Try a different term.`
                        : "Your travel requisition history is currently empty."}
                    </p>

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
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
