import "server-only";
import {
  EMPLOYEE_SEARCHABLE_COLUMNS,
  EMPLOYEE_TABLE_COLUMNS,
  EMPLOYEE_TABLE_FROM,
  employeePositionSearchSql,
} from "@/serverActions/GetEmployeeRequisitionData";
import {
  loadRecords,
  statusFilterSql,
  type RecordFilterSql,
  type RecordsArgs,
} from "./shared";

// Employee Requisition records, bucketed as the Employee dashboard buckets
// them (lib/analytics/queries/employee.ts): approved once the final stage
// approves, in each requisition's own order (hr_before_director)
const OUTCOME = `CASE
  WHEN 'declined' IN (e.employee_hod_approval_status,
                      e.employee_retail_director_approval_status,
                      e.employee_director_approval_status,
                      e.employee_hr_approval_status) THEN 'declined'
  WHEN (CASE WHEN e.hr_before_director
             THEN e.employee_director_approval_status
             ELSE e.employee_hr_approval_status END) = 'approved' THEN 'approved'
  ELSE 'pending'
END`;

const OPEN_STAGE = `CASE
  WHEN e.employee_hod_approval_status <> 'approved' THEN 'hod'
  WHEN e.employee_retail_director_approval_status NOT IN ('approved', 'N/A')
    THEN 'retail_director'
  WHEN e.hr_before_director AND e.employee_hr_approval_status <> 'approved' THEN 'hr'
  WHEN e.employee_director_approval_status <> 'approved' THEN 'director'
  WHEN e.employee_hr_approval_status <> 'approved' THEN 'hr'
END`;

const hasPosition = (kind: string) => `EXISTS (
  SELECT 1 FROM employee_requisition_positions p
  WHERE p.request_id = e.request_id AND p.position_replacement_or_new = '${kind}'
)`;

const FILTER_SQL: RecordFilterSql = {
  status: statusFilterSql(OUTCOME, OPEN_STAGE, [
    "hod",
    "retail_director",
    "hr",
    "director",
  ]),
  kind: {
    new: hasPosition("New"),
    replacement: hasPosition("Replacement"),
  },
  amended: {
    yes: `e.amendment_count > 0`,
    no: `e.amendment_count = 0`,
  },
  source: {
    app: `e.imported_at IS NULL`,
    imported: `e.imported_at IS NOT NULL`,
  },
};

export const loadEmployeeRecords = (args: RecordsArgs) =>
  loadRecords({
    from: EMPLOYEE_TABLE_FROM,
    alias: "e",
    columns: EMPLOYEE_TABLE_COLUMNS,
    departmentColumn: "e.employee_department",
    searchable: EMPLOYEE_SEARCHABLE_COLUMNS,
    extraSearch: employeePositionSearchSql,
    filterSql: FILTER_SQL,
    args,
  });
