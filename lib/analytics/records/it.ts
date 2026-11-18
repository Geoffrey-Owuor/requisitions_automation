import "server-only";
import {
  IT_SEARCHABLE_COLUMNS,
  IT_TABLE_COLUMNS,
} from "@/serverActions/GetITRequisitionData";
import { loadRecords, type RecordFilterSql, type RecordsArgs } from "./shared";

// IT Requisition records, with the statuses bucketed as the IT dashboard
// and report bucket them (older rows say 'approved'/'declined' for IT)
const IT_ACCEPTED = `it_approver_status IN ('accepted', 'approved')`;

const FILTER_SQL: RecordFilterSql = {
  status: {
    accepted: IT_ACCEPTED,
    "awaiting-hod": `hod_approver_status = 'pending'`,
    "awaiting-it": `hod_approver_status = 'approved' AND it_approver_status = 'pending'`,
    "declined-hod": `hod_approver_status = 'declined'`,
    "rejected-it": `it_approver_status IN ('rejected', 'declined')`,
  },
  kind: {
    new: `replacement_new = 'New'`,
    replacement: `replacement_new = 'Replacement'`,
  },
  completion: {
    completed: `completion_status = 'completed'`,
    awaiting: `${IT_ACCEPTED} AND completion_status IS DISTINCT FROM 'completed'`,
  },
};

export const loadItRecords = (args: RecordsArgs) =>
  loadRecords({
    table: "it_requisitions",
    columns: IT_TABLE_COLUMNS,
    departmentColumn: "employee_department",
    searchable: IT_SEARCHABLE_COLUMNS,
    filterSql: FILTER_SQL,
    args,
  });
