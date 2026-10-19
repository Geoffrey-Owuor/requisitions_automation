import "server-only";
import {
  calculateTravelApprovalTier,
  TravelApprovalTier,
  TravelTierThresholds,
} from "@/utils/calculateTravelApprovalTier";

// Shared between the initial submission route and the amendment route so
// both validate/recompute travel requisition form data identically.

export interface TravelFormDataInput {
  employeeName: string;
  department: string;
  designation: string;
  hodApprover: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelCategory: string;
  justification: string;
  travelMode: string;
  transportCost: number;
  otherCost: number;
  perDiem: number;
  costCentre: string;
  withinBudget: string;
  // Already formatted by the client as "<title> - <amount>" lines; empty
  // for departments not flagged requires_engineering_jobs
  engineeringJobs: string;
  // The tier the form showed - a submission whose tier has since changed
  // (the thresholds moved) is rejected so the submitter can review it
  expectedApprovalTier?: string;
}

export const TRAVEL_TIERS_CHANGED_MESSAGE =
  "The travel approval tiers have changed since you opened this form - please review the approval tier and submit again";

export type TravelFormValidationResult =
  | { ok: true; totalCost: number; approvalTier: TravelApprovalTier }
  | { ok: false; message: string; status: 400 | 409 };

// Returns true only if the value is genuinely missing (allowing 0 values)
const isEmpty = (val: unknown) =>
  val === null || val === undefined || val === "";

// Validates submitted/amended travel form data and recomputes the total cost
// and approval tier server-side rather than trusting the client-supplied
// values, so a tampered request can't skip HR/Director review. `thresholds`
// are the tiers in effect on the submission (or amendment) date.
export function validateTravelFormData(
  formData: TravelFormDataInput | undefined,
  thresholds: TravelTierThresholds,
): TravelFormValidationResult {
  if (!formData || typeof formData !== "object") {
    return {
      ok: false,
      status: 400,
      message: "Your requisition is missing some required form fields",
    };
  }

  // Engineering Jobs are checked by resolveEngineeringJobs, once the
  // department's flags are known
  const missingFields = Object.entries(formData).some(([key, value]) => {
    if (key === "engineeringJobs") return false;
    return isEmpty(value);
  });

  if (missingFields) {
    return {
      ok: false,
      status: 400,
      message: "Your requisition is missing some required form fields",
    };
  }

  const totalCost =
    Number(formData.transportCost) +
    Number(formData.otherCost) +
    Number(formData.perDiem);
  const approvalTier = calculateTravelApprovalTier(totalCost, thresholds);

  if (formData.expectedApprovalTier !== approvalTier) {
    return { ok: false, status: 409, message: TRAVEL_TIERS_CHANGED_MESSAGE };
  }

  return { ok: true, totalCost, approvalTier };
}

// Engineering Jobs are required for, and only stored for, departments
// flagged requires_engineering_jobs (base_departments). Returns the value to
// store - null for any other department.
export function resolveEngineeringJobs(
  formData: TravelFormDataInput,
  requiresEngineeringJobs: boolean,
):
  | { ok: true; engineeringJobs: string | null }
  | { ok: false; message: string } {
  if (!requiresEngineeringJobs) return { ok: true, engineeringJobs: null };

  if (isEmpty(formData.engineeringJobs)) {
    return {
      ok: false,
      message: "Your requisition is missing some required form fields",
    };
  }

  return { ok: true, engineeringJobs: formData.engineeringJobs };
}
