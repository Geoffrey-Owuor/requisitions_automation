"use client";
import type { ITRequisitionDataProps } from "@/serverActions/GetITRequisitionData";
import { fetchDashboardTable } from "@/lib/dashboardApi";
import { Monitor, Info } from "lucide-react";
import type { QueryResultRow } from "pg";
import RequisitionTable, { NEUTRAL_THEME } from "../RequisitionTable";
import { ITRequisitionModal } from "./ITRequisitionsModal";
import StatusFormatter from "../StatusFormatter";
import { newRequisitionHref } from "@/lib/dashboardTables";

const dynamicTitles: Record<ITRequisitionDataProps["dataFlag"], string> = {
  userData: "Your Submitted IT Requisitions",
  hodPending: "IT Requisitions Pending Your Approval (HOD)",
  itPending: "IT Requisitions Pending IT Approval",
  history: "IT Requisitions Approval History",
};

// Shared with the analytics Records view (components/Analytics/records/)
export const IT_COLUMNS = [
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
}: ITRequisitionDataProps) {
  return (
    <RequisitionTable
      tableKey={`it-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={Monitor}
      theme={NEUTRAL_THEME}
      searchPlaceholder="Search employee, department or status..."
      columns={IT_COLUMNS}
      queryKey={["ITRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        fetchDashboardTable("it", { ...params, page, pageSize, searchTerm })
      }
      emptyState={{
        Icon: Monitor,
        newRequisitionHref:
          dataFlag === "userData" ? newRequisitionHref("it") : undefined,
      }}
      renderRow={(req) => <ITRequisitionRow req={req} />}
      renderModal={(data, isOpen, close) => (
        <ITRequisitionModal
          isOpen={isOpen}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}

// One table row's cells, shared with the analytics Records view
export function ITRequisitionRow({ req }: { req: QueryResultRow }) {
  return (
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
        <span className="text-sm text-[#1e1b1b]">{req.hod_approver_name}</span>
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
  );
}
