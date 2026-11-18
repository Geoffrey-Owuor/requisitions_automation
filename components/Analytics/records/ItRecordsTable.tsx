"use client";

import { Monitor } from "lucide-react";
import {
  analyticsRecordsQueryKey,
  fetchAnalyticsRecords,
} from "@/lib/analytics/api";
import type { RecordsTableProps } from "@/components/Analytics/AnalyticsRecords";
import RequisitionTable, {
  NEUTRAL_THEME,
} from "@/components/Dashboard/RequisitionTable";
import {
  IT_COLUMNS,
  ITRequisitionRow,
} from "@/components/Dashboard/ITRequisitionsDashboard/ITRequisitionsTable";
import { ITRequisitionModal } from "@/components/Dashboard/ITRequisitionsDashboard/ITRequisitionsModal";

export default function ItRecordsTable({
  filters,
  recordFilters,
}: RecordsTableProps) {
  return (
    <RequisitionTable
      tableKey="analytics-it-records"
      title="IT Requisitions"
      Icon={Monitor}
      theme={NEUTRAL_THEME}
      searchPlaceholder="Search employee, department or status..."
      columns={IT_COLUMNS}
      queryKey={analyticsRecordsQueryKey("it")}
      params={{ filters, recordFilters }}
      queryFn={({ params, page, pageSize, searchTerm }) =>
        fetchAnalyticsRecords("it", { ...params, page, pageSize, searchTerm })
      }
      emptyState={{
        Icon: Monitor,
        heading: "No matching requisitions",
        body: "No IT requisitions were submitted in this range with these filters.",
      }}
      renderRow={(req) => <ITRequisitionRow req={req} />}
      // Read-only: approvals happen from the approvers' own queues
      renderModal={(data, isOpen, close) => (
        <ITRequisitionModal
          isOpen={isOpen}
          data={data}
          dataFlag="history"
          onClose={close}
        />
      )}
    />
  );
}
