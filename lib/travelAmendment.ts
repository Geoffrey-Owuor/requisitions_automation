// Rules for a submitter amending their own travel requisition. Shared by the
// dashboard (button visibility), the amend form's eligibility lookup and the
// amendment route, which is the only place the rules are actually enforced.

import { dateFormatter } from "@/public/assets";

export const MAX_AMENDMENT_REASON_LENGTH = 1000;

export interface TravelAmendmentState {
  hrStatus: string;
  // Same window as HR push-back: on or before travel_departure_date in
  // Africa/Nairobi time (PUSHBACK_WINDOW_SQL in lib/travelPushback.ts).
  withinWindow: boolean;
}

/**
 * Returns why the submitter can't amend, or null when they can. HOD and HR
 * declines are both still amendable - only an HR approval locks it.
 */
export function getTravelAmendmentBlocker({
  hrStatus,
  withinWindow,
}: TravelAmendmentState): string | null {
  if (hrStatus === "approved") {
    return "This requisition can no longer be amended - HR has already approved it";
  }
  if (!withinWindow) {
    return "The departure date for this requisition has passed, so it can no longer be amended";
  }
  return null;
}

// Every amendable form field, in display order. `key` is the TravelFormData
// key (and travel_requisition_amendment_fields.field_key); `column` is the
// travel_requisitions column it is stored in.
export const TRAVEL_AMENDMENT_FIELDS = [
  { key: "employeeName", column: "employee_name", label: "Employee Name", kind: "text" },
  { key: "department", column: "employee_department", label: "Department", kind: "text" },
  { key: "designation", column: "employee_designation", label: "Designation", kind: "text" },
  { key: "costCentre", column: "travel_cost_center", label: "Cost Centre", kind: "text" },
  { key: "hodApprover", column: "travel_hod_approver", label: "HOD Approver", kind: "text" },
  { key: "destination", column: "travel_destination", label: "Destination", kind: "text" },
  { key: "departureDate", column: "travel_departure_date", label: "Departure Date", kind: "date" },
  { key: "returnDate", column: "travel_return_date", label: "Return Date", kind: "date" },
  { key: "travelCategory", column: "travel_category", label: "Travel Category", kind: "text" },
  { key: "travelMode", column: "travel_mode", label: "Travel Mode", kind: "text" },
  { key: "withinBudget", column: "travel_within_budget", label: "Within Budget?", kind: "text" },
  { key: "justification", column: "travel_business_justification", label: "Business Justification", kind: "longtext" },
  { key: "transportCost", column: "travel_transport_cost", label: "Transport Cost", kind: "money" },
  { key: "otherCost", column: "travel_other_costs", label: "Other Costs", kind: "money" },
  { key: "perDiem", column: "travel_per_diem", label: "Per Diem", kind: "money" },
  { key: "engineeringJobs", column: "engineering_jobs", label: "Engineering Jobs", kind: "longtext" },
] as const;

export type TravelAmendmentFieldKey =
  (typeof TRAVEL_AMENDMENT_FIELDS)[number]["key"];

const FIELD_BY_KEY = new Map<string, (typeof TRAVEL_AMENDMENT_FIELDS)[number]>(
  TRAVEL_AMENDMENT_FIELDS.map((field) => [field.key, field]),
);
const FIELD_ORDER = new Map<string, number>(
  TRAVEL_AMENDMENT_FIELDS.map((field, index) => [field.key, index]),
);

export function travelAmendmentFieldLabel(key: string): string {
  return FIELD_BY_KEY.get(key)?.label ?? key;
}

export function isLongTravelAmendmentField(key: string): boolean {
  return FIELD_BY_KEY.get(key)?.kind === "longtext";
}

// Display form of a stored (text) amendment value
export function formatTravelAmendmentValue(
  key: string,
  value: string | null,
): string {
  if (value === null || value === "") return "—";
  switch (FIELD_BY_KEY.get(key)?.kind) {
    case "date":
      return dateFormatter(value);
    case "money":
      return `KES ${Number(value).toLocaleString()}`;
    default:
      return value;
  }
}

export interface TravelAmendmentFieldChange {
  fieldKey: string;
  previousValue: string | null;
  newValue: string | null;
}

export interface TravelAmendmentValues {
  amendmentid: string;
  amendmentnumber: number;
  amendedbyname: string;
  amendedbyemail: string;
  amendmentreason: string;
  createdat: string;
  previoustotalcost: number;
  newtotalcost: number;
  previousapprovaltier: string;
  newapprovaltier: string;
  nullifiedhodstatus: string | null;
  nullifiedhrstatus: string | null;
  nullifieddirectorstatus: string | null;
  fields: TravelAmendmentFieldChange[];
}

// Changed fields in TRAVEL_AMENDMENT_FIELDS order
export function sortTravelAmendmentFields(
  fields: TravelAmendmentFieldChange[],
): TravelAmendmentFieldChange[] {
  return [...fields].sort(
    (a, b) =>
      (FIELD_ORDER.get(a.fieldKey) ?? Infinity) -
      (FIELD_ORDER.get(b.fieldKey) ?? Infinity),
  );
}

export const travelAmendmentsQuery = `
  SELECT
    a.amendment_id AS amendmentid,
    a.amendment_number AS amendmentnumber,
    a.amended_by_name AS amendedbyname,
    a.amended_by_email AS amendedbyemail,
    a.amendment_reason AS amendmentreason,
    a.created_at AS createdat,
    a.previous_total_cost AS previoustotalcost,
    a.new_total_cost AS newtotalcost,
    a.previous_approval_tier AS previousapprovaltier,
    a.new_approval_tier AS newapprovaltier,
    a.nullified_hod_status AS nullifiedhodstatus,
    a.nullified_hr_status AS nullifiedhrstatus,
    a.nullified_director_status AS nullifieddirectorstatus,
    COALESCE(
      (SELECT json_agg(json_build_object(
          'fieldKey', f.field_key,
          'previousValue', f.previous_value,
          'newValue', f.new_value
        ))
       FROM travel_requisition_amendment_fields f
       WHERE f.amendment_id = a.amendment_id),
      '[]'::json
    ) AS fields
  FROM travel_requisition_amendments a
  WHERE a.request_id = $1
  ORDER BY a.amendment_number ASC
`;

// engineering_jobs is stored as "<title> - <amount>" lines. Splits on the
// last " - " so a title containing " - " still round-trips.
export function parseEngineeringJobs(
  value: string | null | undefined,
): { title: string; amount: number }[] {
  if (!value) return [];
  return value
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const separator = line.lastIndexOf(" - ");
      if (separator === -1) return { title: line.trim(), amount: 0 };
      return {
        title: line.slice(0, separator).trim(),
        amount: Number(line.slice(separator + 3)) || 0,
      };
    });
}
