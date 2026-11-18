import "server-only";
import {
  TRAVEL_SEARCHABLE_COLUMNS,
  TRAVEL_TABLE_COLUMNS,
} from "@/serverActions/GetTravelRequisitionData";
import {
  loadRecords,
  statusFilterSql,
  type RecordFilterSql,
  type RecordsArgs,
} from "./shared";

// Travel Requisition records, bucketed as the Travel dashboard buckets them
// (lib/analytics/queries/travel.ts): 'N/A' counts as done
const OUTCOME = `CASE
  WHEN 'declined' IN (r.travel_hod_approval_status, r.travel_hr_approval_status,
                      r.travel_director_approval_status) THEN 'declined'
  WHEN 'pending' IN (r.travel_hod_approval_status, r.travel_hr_approval_status,
                     r.travel_director_approval_status) THEN 'pending'
  ELSE 'approved'
END`;

const OPEN_STAGE = `CASE
  WHEN r.travel_hod_approval_status NOT IN ('approved', 'N/A') THEN 'hod'
  WHEN r.travel_hr_approval_status NOT IN ('approved', 'N/A') THEN 'hr'
  WHEN r.travel_director_approval_status NOT IN ('approved', 'N/A') THEN 'director'
END`;

const FILTER_SQL: RecordFilterSql = {
  status: statusFilterSql(OUTCOME, OPEN_STAGE, ["hod", "hr", "director"]),
  tier: {
    "1": `r.travel_approval_tier = 'Tier 1'`,
    "2": `r.travel_approval_tier = 'Tier 2'`,
    "3": `r.travel_approval_tier = 'Tier 3'`,
  },
  amended: {
    yes: `r.amendment_count > 0`,
    no: `r.amendment_count = 0`,
  },
  pushback: {
    yes: `r.travel_hr_pushback_count > 0`,
    no: `r.travel_hr_pushback_count = 0`,
  },
};

export const loadTravelRecords = (args: RecordsArgs) =>
  loadRecords({
    from: "travel_requisitions r",
    alias: "r",
    columns: TRAVEL_TABLE_COLUMNS,
    departmentColumn: "r.employee_department",
    searchable: TRAVEL_SEARCHABLE_COLUMNS,
    filterSql: FILTER_SQL,
    args,
  });
