"use client";
import type { EmployeeRequisitionDataProps } from "@/serverActions/GetEmployeeRequisitionData";
import { fetchDashboardTable } from "@/lib/dashboardApi";
import { UserRoundPlus, Info } from "lucide-react";
import RequisitionTable, { VIOLET_THEME } from "../RequisitionTable";
import { EmployeeDetailsModal } from "./EmployeeDetailsModal";
import StatusFormatter from "../StatusFormatter";
import { newRequisitionHref } from "@/lib/dashboardTables";

const dynamicTitles: Record<EmployeeRequisitionDataProps["dataFlag"], string> =
  {
    userData: "Your Submitted Employee Requisitions",
    hodPending: "Employee Requisitions Pending Your Approval (HOD)",
    retailDirectorPending:
      "Employee Requisitions Pending Your Approval (Retail Director)",
    hrPending: "Employee Requisitions Pending Your Approval (HR)",
    directorPending: "Employee Requisitions Pending Your Approval (CEO)",
    history: "Employee Requisitions Approval History",
  };

const COLUMNS = [
  { key: "department", label: "Department" },
  { key: "positions", label: "Positions / Headcount" },
  { key: "hod", label: "HOD Status" },
  { key: "retailDirector", label: "Retail Director" },
  // HR before the CEO, as requisitions since migration 034 run (older ones
  // went CEO -> HR, but each column still shows its own stage's status)
  { key: "hr", label: "HR Status" },
  { key: "director", label: "CEO Status" },
];

export default function EmployeeRequisitionsTable({
  dataFlag,
}: EmployeeRequisitionDataProps) {
  return (
    <RequisitionTable
      tableKey={`employee-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={UserRoundPlus}
      theme={VIOLET_THEME}
      searchPlaceholder="Search department, submitter, position or status..."
      columns={COLUMNS}
      queryKey={["EmployeeRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        fetchDashboardTable("employee", {
          ...params,
          page,
          pageSize,
          searchTerm,
        })
      }
      emptyState={{
        Icon: UserRoundPlus,
        newRequisitionHref:
          dataFlag === "userData" ? newRequisitionHref("employee") : undefined,
      }}
      renderRow={(req) => (
        <>
          <td className="px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#1e1b1b]">
                {req.employee_department}
              </span>
              {req.amendment_count > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Amended ×{req.amendment_count}
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm text-[#1e1b1b]">
              {req.total_positions ?? 0} / {req.total_headcount ?? 0}
            </span>
          </td>
          <td className="px-6 py-5">
            <StatusFormatter status={req.employee_hod_approval_status} />
          </td>
          <td className="px-6 py-5">
            <StatusFormatter
              status={req.employee_retail_director_approval_status}
            />
          </td>
          <td className="px-6 py-5">
            <StatusFormatter status={req.employee_hr_approval_status} />
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <StatusFormatter status={req.employee_director_approval_status} />
              <Info
                size={14}
                className="text-violet-200 transition-colors group-hover:text-violet-400"
              />
            </div>
          </td>
        </>
      )}
      renderModal={(data, isOpen, close) => (
        <EmployeeDetailsModal
          isOpen={isOpen}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}
