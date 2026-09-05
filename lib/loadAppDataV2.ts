// Version 2 of loading app data - queries data from the database
"use server";
import { unstable_cache } from "next/cache";
import { query } from "./db";

// Global Interfaces
interface BaseDepartments {
  department_name: string;
}

// Approvers Object
export interface ApproversObject {
  uuid: string;
  name: string;
  email: string;
}

// HOD approver, additionally carrying the department it should be
// auto-selected for (null when a HOD isn't tied to a specific department)
export interface HodApproversObject extends ApproversObject {
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

// Load the hod array
export const loadHodArray = unstable_cache(
  async (): Promise<HodApproversObject[] | []> => {
    try {
      const result = await query<HodApproversObject>(`
            SELECT hod_uuid AS uuid,
            hod_name AS name,
            hod_email AS email,
            hod_department AS department
            FROM hod_array
            `);

      return result;
    } catch (error) {
      console.error("Error while trying to fetch hod array data:", error);
      return [];
    }
  },
  ["hod_array"],
  {
    revalidate: 3600,
    tags: ["GetHodArray"],
  },
);

// Load the hr array
export const loadHrArray = async (): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(`
            SELECT hr_uuid AS uuid,
            hr_name AS name,
            hr_email AS email
            FROM hr_array
            `);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch hr array data:", error);
    return [];
  }
};

// Load the director array
export const loadDirectorArray = async (): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(`
            SELECT director_uuid AS uuid,
            director_name AS name,
            director_email AS email
            FROM director_array
            `);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch director array data:", error);
    return [];
  }
};

// Load the retail director array
export const loadRetailDirectorArray = async (): Promise<
  ApproversObject[] | []
> => {
  try {
    const result = await query<ApproversObject>(`
            SELECT retail_director_uuid AS uuid,
            retail_director_name AS name,
            retail_director_email AS email
            FROM retail_director_array
            `);

    return result;
  } catch (error) {
    console.error(
      "Error while trying to fetch retail director array data:",
      error,
    );
    return [];
  }
};

// Load the it array
export const loadITArray = async (): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(`
            SELECT it_uuid AS uuid,
            it_name AS name,
            it_email AS email
            FROM it_array
            `);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch it array data:", error);
    return [];
  }
};

// Load the security array
export const loadSecurityArray = async (): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(`
      SELECT security_uuid AS uuid,
      security_name AS name,
      security_email AS email
      FROM security_array `);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch security array data:", error);
    return [];
  }
};

// Load the finance array
export const loadFinanceArray = async (): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(`
            SELECT finance_uuid AS uuid,
            finance_name AS name,
            finance_email AS email
            FROM finance_array
            `);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch finance array data:", error);
    return [];
  }
};
