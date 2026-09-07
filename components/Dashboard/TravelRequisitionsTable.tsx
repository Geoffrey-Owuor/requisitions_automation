"use client";
import {
  getTravelRequisitionData,
  TravelRequisitionDataProps,
} from "@/serverActions/GetTravelRequisitionData";
import { PlaneLanding, Info, BriefcaseBusiness } from "lucide-react";
import RequisitionTable, { ROSE_THEME } from "./RequisitionTable";
import { TravelDetailsModal } from "./TravelDetailsModal";
import StatusFormatter from "./StatusFormatter";
import { useToggleStore } from "@/store/useToggleStore";

const dynamicTitles: Record<TravelRequisitionDataProps["dataFlag"], string> = {
  userData: "Your Submitted Travel Requisitions",
  hodPending: "Travel Requisitions Pending Your Approval (HOD)",
  hrPending: "Travel Requisitions Pending Your Approval (HR)",
  directorPending: "Travel Requisitions Pending Your Approval (Director)",
};

const COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "destination", label: "Destination" },
  { key: "dates", label: "Dates" },
  { key: "mode", label: "Mode" },
  { key: "cost", label: "Total Cost" },
  { key: "hod", label: "HOD Status" },
  { key: "hr", label: "HR Status" },
  { key: "director", label: "Director Status" },
];

export default function TravelRequisitionsTable({
  dataFlag,
  onStatusChange,
}: TravelRequisitionDataProps & {
  onStatusChange?: (hasData: boolean) => void;
}) {
  // Zustand store
  const setShowTravelRequisition = useToggleStore(
    (state) => state.setShowTravelRequisition,
  );

  return (
    <RequisitionTable
      tableKey={`travel-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={BriefcaseBusiness}
      theme={ROSE_THEME}
      searchPlaceholder="Search employee, department or status..."
      columns={COLUMNS}
      queryKey={["TravelRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        getTravelRequisitionData({ ...params, page, pageSize, searchTerm })
      }
      onStatusChange={onStatusChange}
      emptyState={{
        Icon: PlaneLanding,
        body: "Your travel requisition history is currently empty.",
        onNewRequisition:
          dataFlag === "userData"
            ? () => setShowTravelRequisition(true)
            : undefined,
      }}
      renderRow={(req) => (
        <>
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
                {new Date(req.travel_departure_date).toLocaleDateString()}
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
            <StatusFormatter status={req.travel_hr_approval_status} />
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <StatusFormatter status={req.travel_director_approval_status} />
              <Info
                size={14}
                className="text-rose-200 transition-colors group-hover:text-rose-400"
              />
            </div>
          </td>
        </>
      )}
      renderModal={(data, close) => (
        <TravelDetailsModal
          isOpen={!!data}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}
