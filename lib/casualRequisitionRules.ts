import "server-only";
import {
  CasualConfig,
  getActiveCasualCategories,
  getCasualSections,
  isCasualLocationAllowed,
  resolveCasualRate,
} from "@/lib/casualConfig";

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
  casualCategory?: string | null;
  // The daily rate the form showed - a submission priced at a rate that has
  // since changed is rejected so the submitter can review the new totals
  expectedRatePerDay?: number;
}

// What an amendment's requisition already has: it may keep these even once
// they're no longer offered (deactivated, or limits changed)
export interface CasualCurrentValues {
  department: string;
  location: string;
  category: string | null;
  sectionNames: string[];
}

export const CASUAL_RATES_CHANGED_MESSAGE =
  "The casual rates have changed since you opened this form - please review the updated totals and submit again";

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
  | {
      ok: true;
      ratePerDay: number;
      // null unless the department requires a category
      casualCategory: string | null;
      computedSections: ComputedCasualSection[];
    }
  | { ok: false; message: string; status: 400 | 409 };

// Validates a submitted/amended casual requisition form against the casual
// config and recomputes the derived per-section values server-side rather
// than trusting the client. Rates are picked for `date` (the submission or
// amendment date, Africa/Nairobi).
export function validateCasualFormData(
  formData: CasualFormDataInput,
  {
    config,
    casualCategoryRequired,
    date,
    current = null,
  }: {
    config: CasualConfig;
    casualCategoryRequired: boolean;
    date: string;
    current?: CasualCurrentValues | null;
  },
): CasualFormValidationResult {
  const { department, hodApprover, location, sections } = formData;

  if (isEmpty(department) || isEmpty(hodApprover) || isEmpty(location)) {
    return {
      ok: false,
      status: 400,
      message: "Your requisition is missing some required form fields",
    };
  }

  // An amendment may keep what its requisition already has
  const keepsCurrent = current?.department === department;

  if (
    !isCasualLocationAllowed(config, department, location) &&
    !(keepsCurrent && current?.location === location)
  ) {
    return {
      ok: false,
      status: 400,
      message: `"${location}" is not an available location for the selected department`,
    };
  }

  const casualCategory = casualCategoryRequired
    ? (formData.casualCategory ?? null)
    : null;

  if (
    casualCategoryRequired &&
    !(
      (casualCategory &&
        getActiveCasualCategories(config).includes(casualCategory)) ||
      (keepsCurrent && casualCategory && current?.category === casualCategory)
    )
  ) {
    return {
      ok: false,
      status: 400,
      message: "A valid casual category is required for the selected department",
    };
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return {
      ok: false,
      status: 400,
      message: "At least one section is required to submit this requisition",
    };
  }

  // The set of sections valid for this department/location - guards against tampering
  const allowedSections = [
    ...getCasualSections(config, department, location),
    ...(keepsCurrent ? (current?.sectionNames ?? []) : []),
  ];

  for (const section of sections) {
    if (!allowedSections.includes(section.sectionName)) {
      return {
        ok: false,
        status: 400,
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
        status: 400,
        message: `Section "${section.sectionName}" is missing some required fields`,
      };
    }

    if (Number(section.numberOfCasuals) <= 0) {
      return {
        ok: false,
        status: 400,
        message: `Section "${section.sectionName}" must request at least 1 casual`,
      };
    }

    if (section.periodTo < section.periodFrom) {
      return {
        ok: false,
        status: 400,
        message: `Section "${section.sectionName}"'s engagement period end date cannot be earlier than its start date`,
      };
    }
  }

  const ratePerDay = resolveCasualRate(config.rates, {
    department,
    location,
    category: casualCategory,
    date,
  });

  if (ratePerDay === null) {
    return {
      ok: false,
      status: 400,
      message:
        "No daily casual rate is set up for the selected department and location, contact the admin for support",
    };
  }

  if (formData.expectedRatePerDay !== ratePerDay) {
    return { ok: false, status: 409, message: CASUAL_RATES_CHANGED_MESSAGE };
  }

  const computedSections = sections.map((section) => {
    const engagementDays = engagementDaysBetween(
      section.periodFrom,
      section.periodTo,
    );
    const totalAmount =
      Number(section.numberOfCasuals) * ratePerDay * engagementDays;

    return { ...section, engagementDays, totalAmount };
  });

  return { ok: true, ratePerDay, casualCategory, computedSections };
}
