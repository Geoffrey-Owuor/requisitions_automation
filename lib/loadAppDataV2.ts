// Version 2 of loading app data - queries data from the database.
// "use server": these are called from the submission forms in the browser,
// so nothing here may return approval tokens (*_uuid). Approver lists with
// tokens live in the server-only lib/loadApprovers.ts.
"use server";
import { unstable_cache } from "next/cache";
import { query } from "./db";
import { getSession } from "./session";
import { loadCasualConfig as loadCachedCasualConfig } from "./loadCasualConfig";
import type { CasualConfig, CasualRateRule } from "./casualConfig";
import {
  loadItRequirementItems as loadCachedItRequirementItems,
  loadJobGrades as loadCachedJobGrades,
  loadTravelTierThresholds as loadCachedTravelTierThresholds,
  type ItRequirementItem,
  type JobGrade,
} from "./loadRequisitionOptions";
import type { TravelTierThresholds } from "@/utils/calculateTravelApprovalTier";

// A department as the forms see it: its name plus the flags that change
// what a form asks for (base_departments, migrations 024/025)
export interface BaseDepartment {
  name: string;
  casualCategoryRequired: boolean;
  requiresEngineeringJobs: boolean;
}

// HOD approver for the submission forms, carrying the department it should
// be auto-selected for (null when a HOD isn't tied to a specific department).
// Deliberately has no uuid: hod_uuid is the HOD's approval token and this
// list is sent to the browser.
export interface HodApproversObject {
  name: string;
  email: string;
  department: string | null;
}

// Active departments only. Errors are caught outside the cache so a failed
// read (e.g. code deployed before its migration ran) isn't cached as an
// empty list for an hour.
const loadCachedBaseDepartments = unstable_cache(
  async (): Promise<BaseDepartment[]> =>
    query<BaseDepartment>(
      `SELECT department_name AS name,
       casual_category_required AS "casualCategoryRequired",
       requires_engineering_jobs AS "requiresEngineeringJobs"
       FROM base_departments WHERE is_active = true`,
    ),
  ["base_departments_with_flags"],
  {
    revalidate: 3600,
    tags: ["GetBaseDepartments"],
  },
);

// An amendment form still shows its requisition's department if it was made
// inactive since (FormSelect displays a value that isn't among its options).
export const loadBaseDepartments = async (): Promise<BaseDepartment[]> => {
  try {
    return await loadCachedBaseDepartments();
  } catch (error) {
    console.error("Error while trying to fetch base departments:", error);
    return [];
  }
};

// Load the hod array - selectable HODs only. Alternate-only HODs
// (hod_array.is_alternate_only) are never offered in the submission dropdown
// or department auto-select; they act through lib/hodAssignment.ts instead.
// Errors are caught outside the cache, as for the departments above.
const loadCachedHodArray = unstable_cache(
  async (): Promise<HodApproversObject[]> =>
    query<HodApproversObject>(`
      SELECT hod_name AS name,
      hod_email AS email,
      hod_department AS department
      FROM hod_array
      WHERE is_alternate_only = false
      `),
  ["hod_array_public"],
  {
    revalidate: 3600,
    tags: ["GetHodArray"],
  },
);

// Client-callable (the submission forms load it), so it is session-gated.
export const loadHodArray = async (): Promise<HodApproversObject[] | []> => {
  if (!(await getSession())) return [];
  try {
    return await loadCachedHodArray();
  } catch (error) {
    console.error("Error while trying to fetch hod array data:", error);
    return [];
  }
};

// Client-callable (the casual form loads it), so it is session-gated. Null
// when signed out or the config can't be read - the form can't price
// anything without it.
export const loadCasualConfig = async (): Promise<CasualConfig | null> => {
  if (!(await getSession())) return null;
  try {
    return await loadCachedCasualConfig();
  } catch (error) {
    console.error("Error while trying to fetch the casual config:", error);
    return null;
  }
};

// The casual rate rules alone, for the public casual guideline page (which
// published these rates before they moved to the database). Not
// session-gated for that reason; returns nothing else from the config.
export const loadPublicCasualRates = async (): Promise<CasualRateRule[]> => {
  try {
    return (await loadCachedCasualConfig()).rates;
  } catch (error) {
    console.error("Error while trying to fetch the casual rates:", error);
    return [];
  }
};

// Travel tier thresholds, every effective date (thresholdsOn picks one).
// Session-gated for the Travel form; null when they can't be read.
export const loadTravelTiers = async (): Promise<
  TravelTierThresholds[] | null
> => {
  if (!(await getSession())) return null;
  try {
    return await loadCachedTravelTierThresholds();
  } catch (error) {
    console.error("Error while trying to fetch the travel tiers:", error);
    return null;
  }
};

// The same thresholds for the public Travel guideline page, which published
// them before they moved to the database
export const loadPublicTravelTiers = async (): Promise<
  TravelTierThresholds[]
> => {
  try {
    return await loadCachedTravelTierThresholds();
  } catch (error) {
    console.error("Error while trying to fetch the travel tiers:", error);
    return [];
  }
};

// Job grades in rank order, inactive ones included; session-gated for the
// Employee form
export const loadJobGradeOptions = async (): Promise<JobGrade[]> => {
  if (!(await getSession())) return [];
  try {
    return await loadCachedJobGrades();
  } catch (error) {
    console.error("Error while trying to fetch the job grades:", error);
    return [];
  }
};

// Active IT requirement items; session-gated for the IT form
export const loadItRequirementOptions = async (): Promise<
  ItRequirementItem[]
> => {
  if (!(await getSession())) return [];
  try {
    return (await loadCachedItRequirementItems()).filter(
      (item) => item.isActive,
    );
  } catch (error) {
    console.error(
      "Error while trying to fetch the IT requirement items:",
      error,
    );
    return [];
  }
};
