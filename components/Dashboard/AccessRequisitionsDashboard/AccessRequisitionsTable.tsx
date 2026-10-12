"use client";
import type { AccessRequisitionDataProps } from "@/serverActions/GetAccessRequisitionData";
import { fetchDashboardTable } from "@/lib/dashboardApi";
import { LockKeyhole, Info } from "lucide-react";
import RequisitionTable, { AMBER_THEME } from "../RequisitionTable";
import { AccessDetailsModal } from "./AccessDetailsModal";
import StatusFormatter from "../StatusFormatter";
import { newRequisitionHref } from "@/lib/dashboardTables";

const dynamicTitles: Record<AccessRequisitionDataProps["dataFlag"], string> = {
  userData: "Your Submitted Key & Access Requisitions",
  hodPending: "Key & Access Requisitions Pending Your Approval (HOD)",
  securityPending: "Key & Access Requisitions Pending Your Approval (Security)",
  history: "Key & Access Requisitions Approval History",
};

const COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "department", label: "Department" },
  { key: "date", label: "Issuance Date" },
  { key: "locations", label: "Locations" },
  { key: "hod", label: "HOD Status" },
  { key: "security", label: "Security Status" },
];

export default function AccessRequisitionsTable({
  dataFlag,
}: AccessRequisitionDataProps) {
  return (
    <RequisitionTable
      tableKey={`access-${dataFlag}`}
      title={dynamicTitles[dataFlag]}
      Icon={LockKeyhole}
      theme={AMBER_THEME}
      searchPlaceholder="Search employee, department or status..."
      columns={COLUMNS}
      queryKey={["AccessRequisitionsData"]}
      params={{ dataFlag }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        fetchDashboardTable("access", {
          ...params,
          page,
          pageSize,
          searchTerm,
        })
      }
      emptyState={{
        Icon: LockKeyhole,
        newRequisitionHref:
          dataFlag === "userData" ? newRequisitionHref("access") : undefined,
      }}
      renderRow={(req) => (
        <>
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
          <td className="px-6 py-5">
            <span className="text-sm text-[#1e1b1b]">
              {req.employee_department}
            </span>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm text-[#a18080]">
              {new Date(req.issuance_date).toLocaleDateString()}
            </span>
          </td>
          <td className="max-w-50 truncate px-6 py-5">
            <span className="text-sm text-[#1e1b1b]">
              {req.access_locations}
            </span>
          </td>
          <td className="px-6 py-5">
            <StatusFormatter status={req.hod_approver_status} />
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <StatusFormatter status={req.security_approver_status} />
              <Info
                size={14}
                className="text-amber-200 transition-colors group-hover:text-amber-400"
              />
            </div>
          </td>
        </>
      )}
      renderModal={(data, isOpen, close) => (
        <AccessDetailsModal
          isOpen={isOpen}
          data={data}
          dataFlag={dataFlag}
          onClose={close}
        />
      )}
    />
  );
}
