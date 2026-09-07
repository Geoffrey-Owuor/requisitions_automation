"use client";
import {
  getITRequisitionData,
  ITRequisitionDataProps,
} from "@/serverActions/GetITRequisitionData";
import { Monitor, Info } from "lucide-react";
import RequisitionTable, { NEUTRAL_THEME } from "../RequisitionTable";
import { ITRequisitionModal } from "./ITRequisitionsModal";
import StatusFormatter from "../StatusFormatter";
import ITDataExport from "./ITDataExport";
import { useToggleStore } from "@/store/useToggleStore";

const dynamicTitles: Record<ITRequisitionDataProps["dataFlag"], string> = {
  userData: "Your Submitted IT Requisitions",
  hodPending: "IT Requisitions Pending Your Approval (HOD)",
  itPending: "IT Requisitions Pending IT Approval",
  itAll: "All Submitted IT Requisitions",
};

const COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "department", label: "Department" },
  { key: "type", label: "Type" },
  { key: "hod", label: "HOD" },
  { key: "date", label: "Requisition Date" },
  { key: "hodStatus", label: "HOD Status" },
  { key: "itStatus", label: "IT Status" },
  { key: "completion", label: "Completion" },
];

export default function ITRequisitionsTable({
  dataFlag,
  onStatusChange,
}: ITRequisitionDataProps & {
  onStatusChange?: (hasData: boolean) => void;
}) {
  // Zustand store
  const setShowITRequisition = useToggleStore(
    (state) => state.setShowITRequisition,
  );

  return (
    <RequisitionTable
      tableKey={`it-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={Monitor}
      theme={NEUTRAL_THEME}
      searchPlaceholder="Search employee, department or status..."
      columns={COLUMNS}
      queryKey={["ITRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        getITRequisitionData({ ...params, page, pageSize, searchTerm })
      }
      onStatusChange={onStatusChange}
      toolbarSlot={dataFlag === "itAll" ? <ITDataExport /> : undefined}
      emptyState={{
        Icon: Monitor,
        body: "Your IT requisition history is currently empty.",
        onNewRequisition:
          dataFlag === "userData"
            ? () => setShowITRequisition(true)
            : undefined,
      }}
      renderRow={(req) => (
        <>
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

          {/* HOD */}
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
                className={`${req.completion_status === "completed" ? "text-blue-200 group-hover:text-blue-400" : "text-red-200 group-hover:text-red-400"} transition-colors`}
              />
            </div>
          </td>
        </>
      )}
      renderModal={(data, close) => (
        <ITRequisitionModal
          isOpen={!!data}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}
