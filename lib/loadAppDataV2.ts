// Version 2 of loading app data - queries data from the database.
// "use server": these are called from the submission forms in the browser,
// so nothing here may return approval tokens (*_uuid). Approver lists with
// tokens live in the server-only lib/loadApprovers.ts.
"use server";
import { unstable_cache } from "next/cache";
import { query } from "./db";
import { getSession } from "./session";

// Global Interfaces
interface BaseDepartments {
  department_name: string;
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

// Loading base departments
export const loadBaseDepartments = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const result = await query<BaseDepartments>(
        "SELECT department_name FROM base_departments",
      );

      return result.map((dept) => dept.department_name);
    } catch (error) {
      console.error("Error while trying to fetch base departments:", error);
      return [];
    }
  },
  ["base_departments"],
  {
    revalidate: 3600,
    tags: ["GetBaseDepartments"],
  },
);

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
