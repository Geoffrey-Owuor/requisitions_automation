"use client";
import {
  getCasualRequisitionData,
  CasualRequisitionDataProps,
} from "@/serverActions/GetCasualRequisitionData";
import { HardHat, Info } from "lucide-react";
import RequisitionTable, { EMERALD_THEME } from "../RequisitionTable";
import { CasualDetailsModal } from "./CasualDetailsModal";
import StatusFormatter from "../StatusFormatter";
import { useToggleStore } from "@/store/useToggleStore";

const dynamicTitles: Record<CasualRequisitionDataProps["dataFlag"], string> = {
  userData: "Your Submitted Casual Requisitions",
  hodPending: "Casual Requisitions Pending Your Approval (HOD)",
  hrPending: "Casual Requisitions Pending Your Approval (HR)",
};

const COLUMNS = [
  { key: "location", label: "Location" },
  { key: "department", label: "Department" },
  { key: "sections", label: "Sections" },
  { key: "casuals", label: "Casuals (Approved / Requested)" },
  { key: "amount", label: "Total Amount" },
  { key: "hod", label: "HOD Status" },
  { key: "hr", label: "HR Status" },
];

export default function CasualRequisitionsTable({
  dataFlag,
  onStatusChange,
}: CasualRequisitionDataProps & {
  onStatusChange?: (hasData: boolean) => void;
}) {
  // Zustand store
  const setShowCasualRequisition = useToggleStore(
    (state) => state.setShowCasualRequisition,
  );

  return (
    <RequisitionTable
      tableKey={`casual-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={HardHat}
      theme={EMERALD_THEME}
      searchPlaceholder="Search location, department, section or status..."
      columns={COLUMNS}
      queryKey={["CasualRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        getCasualRequisitionData({ ...params, page, pageSize, searchTerm })
      }
      onStatusChange={onStatusChange}
      emptyState={{
        Icon: HardHat,
        body: "Your casual requisition history is currently empty.",
        onNewRequisition:
          dataFlag === "userData"
            ? () => setShowCasualRequisition(true)
            : undefined,
      }}
      renderRow={(req) => (
        <>
          <td className="px-6 py-5">
            <span className="text-sm font-medium text-[#1e1b1b]">
              {req.casual_location}
            </span>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm text-[#1e1b1b]">
              {req.employee_department}
            </span>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm text-[#a18080]">
              {req.section_count ?? 0}
            </span>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm text-[#1e1b1b]">
              {req.approved_casuals ?? 0} / {req.total_casuals ?? 0}
            </span>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm font-semibold">
              KES {req.total_amount ?? 0}
            </span>
          </td>
          <td className="px-6 py-5">
            <StatusFormatter status={req.casual_hod_approval_status} />
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <StatusFormatter status={req.casual_hr_approval_status} />
              <Info
                size={14}
                className="text-emerald-200 transition-colors group-hover:text-emerald-400"
              />
            </div>
          </td>
        </>
      )}
      renderModal={(data, close) => (
        <CasualDetailsModal
          isOpen={!!data}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}
