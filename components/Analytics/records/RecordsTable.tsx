"use client";

import type { ComponentType, ReactNode } from "react";
import type { QueryResultRow } from "pg";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  HardHat,
  Monitor,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import {
  analyticsRecordsQueryKey,
  fetchAnalyticsRecords,
} from "@/lib/analytics/api";
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import type { RecordFilters } from "@/lib/analytics/records";
import RequisitionTable, {
  EMERALD_THEME,
  NEUTRAL_THEME,
  ROSE_THEME,
  VIOLET_THEME,
  type RequisitionTableTheme,
} from "@/components/Dashboard/RequisitionTable";
import {
  TRAVEL_COLUMNS,
  TravelRequisitionRow,
} from "@/components/Dashboard/TravelRequisitionsTable";
import { TravelDetailsModal } from "@/components/Dashboard/TravelDetailsModal";
import {
  CASUAL_COLUMNS,
  CasualRequisitionRow,
} from "@/components/Dashboard/CasualRequisitionsDashboard/CasualRequisitionsTable";
import { CasualDetailsModal } from "@/components/Dashboard/CasualRequisitionsDashboard/CasualDetailsModal";
import {
  EMPLOYEE_COLUMNS,
  EmployeeRequisitionRow,
} from "@/components/Dashboard/EmployeeRequisitionsDashboard/EmployeeRequisitionsTable";
import { EmployeeDetailsModal } from "@/components/Dashboard/EmployeeRequisitionsDashboard/EmployeeDetailsModal";
import {
  IT_COLUMNS,
  ITRequisitionRow,
} from "@/components/Dashboard/ITRequisitionsDashboard/ITRequisitionsTable";
import { ITRequisitionModal } from "@/components/Dashboard/ITRequisitionsDashboard/ITRequisitionsModal";
import {
  ADVANCE_COLUMNS,
  SalaryAdvanceRowCells,
} from "@/components/SalaryAdvance/SalaryAdvanceTable";
import { SalaryAdvanceModal } from "@/components/SalaryAdvance/SalaryAdvanceModal";
import type { SalaryAdvanceData } from "@/serverActions/GetSalaryAdvanceData";

type ModalRenderer = (
  data: QueryResultRow | null,
  isOpen: boolean,
  onClose: () => void,
) => ReactNode;

// Each dashboard's table reuses its requisition type's dashboard row and
// details modal, opened read-only: approvals happen from the approvers' own
// queues, and Travel's `records` flag also hides HR push-back
const RECORD_TABLES: Partial<
  Record<
    AnalyticsType,
    {
      title: string;
      // Plural, for the empty state
      noun: string;
      Icon: LucideIcon;
      theme: RequisitionTableTheme;
      searchPlaceholder: string;
      columns: { key: string; label: string }[];
      Row: ComponentType<{ req: QueryResultRow }>;
      renderModal: ModalRenderer;
    }
  >
> = {
  travel: {
    title: "Travel Requisitions",
    noun: "travel requisitions",
    Icon: BriefcaseBusiness,
    theme: ROSE_THEME,
    searchPlaceholder: "Search employee, destination, mode or status...",
    columns: TRAVEL_COLUMNS,
    Row: TravelRequisitionRow,
    renderModal: (data, isOpen, onClose) => (
      <TravelDetailsModal
        isOpen={isOpen}
        data={data}
        dataFlag="records"
        onClose={onClose}
      />
    ),
  },
  casual: {
    title: "Casual Requisitions",
    noun: "casual requisitions",
    Icon: HardHat,
    theme: EMERALD_THEME,
    searchPlaceholder: "Search location, department, section or status...",
    columns: CASUAL_COLUMNS,
    Row: CasualRequisitionRow,
    renderModal: (data, isOpen, onClose) => (
      <CasualDetailsModal
        isOpen={isOpen}
        data={data}
        dataFlag="history"
        onClose={onClose}
      />
    ),
  },
  employee: {
    title: "Employee Requisitions",
    noun: "employee requisitions",
    Icon: UserRoundPlus,
    theme: VIOLET_THEME,
    searchPlaceholder: "Search department, submitter, position or status...",
    columns: EMPLOYEE_COLUMNS,
    Row: EmployeeRequisitionRow,
    renderModal: (data, isOpen, onClose) => (
      <EmployeeDetailsModal
        isOpen={isOpen}
        data={data}
        dataFlag="history"
        onClose={onClose}
      />
    ),
  },
  it: {
    title: "IT Requisitions",
    noun: "IT requisitions",
    Icon: Monitor,
    theme: NEUTRAL_THEME,
    searchPlaceholder: "Search employee, department or status...",
    columns: IT_COLUMNS,
    Row: ITRequisitionRow,
    renderModal: (data, isOpen, onClose) => (
      <ITRequisitionModal
        isOpen={isOpen}
        data={data}
        dataFlag="history"
        onClose={onClose}
      />
    ),
  },
  advance: {
    title: "Salary Advance Requests",
    noun: "salary advance requests",
    Icon: CircleDollarSign,
    theme: ROSE_THEME,
    searchPlaceholder: "Search staff, department, type or status...",
    columns: ADVANCE_COLUMNS,
    // The records route returns the HR table's row shape
    Row: ({ req }) => <SalaryAdvanceRowCells req={req as SalaryAdvanceData} />,
    renderModal: (data, isOpen, onClose) => (
      <SalaryAdvanceModal
        isOpen={isOpen}
        data={data as SalaryAdvanceData | null}
        onClose={onClose}
        readOnly
      />
    ),
  },
};

export default function RecordsTable({
  type,
  filters,
  recordFilters,
}: {
  type: AnalyticsType;
  filters: AnalyticsFilters;
  recordFilters: RecordFilters;
}) {
  const config = RECORD_TABLES[type];
  if (!config) return null;
  const { Row } = config;

  return (
    <RequisitionTable
      tableKey={`analytics-${type}-records`}
      title={config.title}
      Icon={config.Icon}
      theme={config.theme}
      searchPlaceholder={config.searchPlaceholder}
      columns={config.columns}
      queryKey={analyticsRecordsQueryKey(type)}
      params={{ filters, recordFilters }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        fetchAnalyticsRecords(type, { ...params, page, pageSize, searchTerm })
      }
      emptyState={{
        Icon: config.Icon,
        heading: "Nothing matches these filters",
        body: `No ${config.noun} were submitted in this range with these filters.`,
      }}
      renderRow={(req) => <Row req={req} />}
      renderModal={config.renderModal}
    />
  );
}
