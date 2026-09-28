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
  // for non-engineering departments
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

  const isEngineering = formData.department === "Engineering & HVAC";

  const missingFields =
    Object.entries(formData).some(([key, value]) => {
      if (key === "engineeringJobs") return false;
      return isEmpty(value);
    }) ||
    (isEngineering && !formData.engineeringJobs);

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
