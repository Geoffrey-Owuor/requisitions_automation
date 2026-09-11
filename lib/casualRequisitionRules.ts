import "server-only";
import { query } from "@/lib/db";
import {
  getCasualRatePerDay,
  getCasualSections,
  ENGINEERING_HVAC_DEPARTMENT,
  CASUAL_CATEGORIES,
  CasualCategory,
} from "@/public/assets";

// Shared between the initial submission route and the amendment route so
// both validate/recompute casual requisition form data identically rather
// than duplicating the SQL and business rules.

export interface CasualSectionInput {
  sectionName: string;
  justification: string;
  numberOfCasuals: number;
  ppesRequired: string;
  periodFrom: string;
  periodTo: string;
}

export interface CasualFormDataInput {
  department: string;
  hodApprover: string;
  location: string;
  sections: CasualSectionInput[];
  casualCategory?: CasualCategory;
}

// Inclusive day-count between two ISO (YYYY-MM-DD) date strings
export function engagementDaysBetween(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T00:00:00");
  const diffDays =
    Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return diffDays;
}

const isEmpty = (val: unknown) =>
  val === null || val === undefined || val === "";

export type ComputedCasualSection = CasualSectionInput & {
  engagementDays: number;
  totalAmount: number;
};

export type CasualFormValidationResult =
  | { ok: true; ratePerDay: number; computedSections: ComputedCasualSection[] }
  | { ok: false; message: string };

// Validates a submitted/amended casual requisition form and recomputes the
// derived per-section values server-side rather than trusting the client.
export function validateCasualFormData(
  formData: CasualFormDataInput,
): CasualFormValidationResult {
  const { department, hodApprover, location, sections, casualCategory } =
    formData;

  if (isEmpty(department) || isEmpty(hodApprover) || isEmpty(location)) {
    return {
      ok: false,
      message: "Your requisition is missing some required form fields",
    };
  }

  if (
    department === ENGINEERING_HVAC_DEPARTMENT &&
    !CASUAL_CATEGORIES.includes(casualCategory as CasualCategory)
  ) {
    return {
      ok: false,
      message:
        "A valid casual category (Technician or Welder) is required for the Engineering & HVAC department",
    };
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return {
      ok: false,
      message: "At least one section is required to submit this requisition",
    };
  }

  // The set of sections valid for this department/location - guards against tampering
  const allowedSections = getCasualSections(department, location);

  for (const section of sections) {
    if (!allowedSections.includes(section.sectionName)) {
      return {
        ok: false,
        message: `"${section.sectionName}" is not a valid section for the selected location`,
      };
    }

    if (
      isEmpty(section.justification) ||
      isEmpty(section.ppesRequired) ||
      isEmpty(section.periodFrom) ||
      isEmpty(section.periodTo)
    ) {
      return {
        ok: false,
        message: `Section "${section.sectionName}" is missing some required fields`,
      };
    }

    if (Number(section.numberOfCasuals) <= 0) {
      return {
        ok: false,
        message: `Section "${section.sectionName}" must request at least 1 casual`,
      };
    }

    if (section.periodTo < section.periodFrom) {
      return {
        ok: false,
        message: `Section "${section.sectionName}"'s engagement period end date cannot be earlier than its start date`,
      };
    }
  }

  const ratePerDay = getCasualRatePerDay(
    location,
    department,
    casualCategory,
  );

  const computedSections = sections.map((section) => {
    const engagementDays = engagementDaysBetween(
      section.periodFrom,
      section.periodTo,
    );
    const totalAmount =
      Number(section.numberOfCasuals) * ratePerDay * engagementDays;

    return { ...section, engagementDays, totalAmount };
  });

  return { ok: true, ratePerDay, computedSections };
}

export interface ResolvedHod {
  uuid: string;
  email: string;
}

// Looks up the HOD approver's uuid/email from hod_array - returns null when
// no such HOD exists (e.g. a stale/tampered hodApprover name).
export async function resolveHod(
  hodApprover: string,
): Promise<ResolvedHod | null> {
  const result = await query<{ uuid: string; email: string }>(
    `
    SELECT hod_uuid AS uuid,
    hod_email AS email
    FROM hod_array WHERE hod_name = $1 LIMIT 1
    `,
    [hodApprover],
  );

  if (result.length === 0) return null;

  return { uuid: result[0].uuid, email: result[0].email };
}
