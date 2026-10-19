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
const loadCachedHodArray = unstable_cache(
  async (): Promise<HodApproversObject[] | []> => {
    try {
      const result = await query<HodApproversObject>(`
            SELECT hod_name AS name,
            hod_email AS email,
            hod_department AS department
            FROM hod_array
            WHERE is_alternate_only = false
            `);

      return result;
    } catch (error) {
      console.error("Error while trying to fetch hod array data:", error);
      return [];
    }
  },
  ["hod_array_public"],
  {
    revalidate: 3600,
    tags: ["GetHodArray"],
  },
);

// Client-callable (the submission forms load it), so it is session-gated.
export const loadHodArray = async (): Promise<HodApproversObject[] | []> => {
  if (!(await getSession())) return [];
  return loadCachedHodArray();
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
