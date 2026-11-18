import "server-only";
import {
  CASUAL_SEARCHABLE_COLUMNS,
  CASUAL_TABLE_COLUMNS,
  CASUAL_TABLE_FROM,
  casualSectionSearchSql,
} from "@/serverActions/GetCasualRequisitionData";
import {
  loadRecords,
  statusFilterSql,
  type RecordFilterSql,
  type RecordsArgs,
} from "./shared";

// Casual Requisition records (HOD -> HR), bucketed as the Casual dashboard
// buckets them (lib/analytics/queries/casual.ts)
const OUTCOME = `CASE
  WHEN 'declined' IN (c.casual_hod_approval_status, c.casual_hr_approval_status)
    THEN 'declined'
  WHEN c.casual_hod_approval_status = 'approved'
   AND c.casual_hr_approval_status = 'approved' THEN 'approved'
  ELSE 'pending'
END`;

const OPEN_STAGE = `CASE
  WHEN c.casual_hod_approval_status <> 'approved' THEN 'hod'
  WHEN c.casual_hr_approval_status <> 'approved' THEN 'hr'
END`;

const FILTER_SQL: RecordFilterSql = {
  status: statusFilterSql(OUTCOME, OPEN_STAGE, ["hod", "hr"]),
  amended: {
    yes: `c.amendment_count > 0`,
    no: `c.amendment_count = 0`,
  },
};

export const loadCasualRecords = (args: RecordsArgs) =>
  loadRecords({
    from: CASUAL_TABLE_FROM,
    alias: "c",
    columns: CASUAL_TABLE_COLUMNS,
    departmentColumn: "c.employee_department",
    searchable: CASUAL_SEARCHABLE_COLUMNS,
    extraSearch: casualSectionSearchSql,
    filterSql: FILTER_SQL,
    args,
  });
