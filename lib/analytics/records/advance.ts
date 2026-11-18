import "server-only";
import {
  ADVANCE_SEARCHABLE_COLUMNS,
  ADVANCE_TABLE_COLUMNS,
  ADVANCE_TABLE_FROM,
} from "@/lib/salaryAdvanceTable";
import {
  loadRecords,
  statusFilterSql,
  type RecordFilterSql,
  type RecordsArgs,
} from "./shared";

// Salary advance records. HR's review is the only stage, so the request's
// approval_status is its outcome and HR is the only open stage.
const FILTER_SQL: RecordFilterSql = {
  status: statusFilterSql("sa.approval_status", "'hr'", ["hr"]),
  type: {
    oneoff: `sa.request_type = 'oneoff'`,
    continuous: `sa.request_type = 'continuous'`,
  },
  exported: {
    yes: `sa.exported`,
    no: `NOT sa.exported`,
  },
  altered: {
    yes: `alt.alterations IS NOT NULL`,
    no: `alt.alterations IS NULL`,
  },
};

export const loadAdvanceRecords = (args: RecordsArgs) =>
  loadRecords({
    from: ADVANCE_TABLE_FROM,
    alias: "sa",
    columns: ADVANCE_TABLE_COLUMNS,
    departmentColumn: "sa.staff_department",
    searchable: ADVANCE_SEARCHABLE_COLUMNS,
    filterSql: FILTER_SQL,
    args,
  });
