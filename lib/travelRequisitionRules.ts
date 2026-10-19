import "server-only";
import {
  calculateTravelApprovalTier,
  TravelApprovalTier,
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
}

export type TravelFormValidationResult =
  | { ok: true; totalCost: number; approvalTier: TravelApprovalTier }
  | { ok: false; message: string };

// Returns true only if the value is genuinely missing (allowing 0 values)
const isEmpty = (val: unknown) =>
  val === null || val === undefined || val === "";

// Validates submitted/amended travel form data and recomputes the total cost
// and approval tier server-side rather than trusting the client-supplied
// values, so a tampered request can't skip HR/Director review.
export function validateTravelFormData(
  formData: TravelFormDataInput | undefined,
): TravelFormValidationResult {
  if (!formData || typeof formData !== "object") {
    return {
      ok: false,
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
      message: "Your requisition is missing some required form fields",
    };
  }

  const totalCost =
    Number(formData.transportCost) +
    Number(formData.otherCost) +
    Number(formData.perDiem);

  return {
    ok: true,
    totalCost,
    approvalTier: calculateTravelApprovalTier(totalCost),
  };
}

// Engineering Jobs are required for, and only stored for, departments
// flagged requires_engineering_jobs (base_departments). Returns the value to
// store - null for any other department.
export function resolveEngineeringJobs(
  formData: TravelFormDataInput,
  requiresEngineeringJobs: boolean,
): { ok: true; engineeringJobs: string | null } | { ok: false; message: string } {
  if (!requiresEngineeringJobs) return { ok: true, engineeringJobs: null };

  if (isEmpty(formData.engineeringJobs)) {
    return {
      ok: false,
      message: "Your requisition is missing some required form fields",
    };
  }

  return { ok: true, engineeringJobs: formData.engineeringJobs };
}
