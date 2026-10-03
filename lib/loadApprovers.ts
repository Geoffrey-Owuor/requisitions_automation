// Approver lists for the server-side email fan-out. Each row carries the
// approver's *_uuid, which is their approval token, so this module is
// server-only and deliberately NOT "use server": a "use server" export can be
// turned into a browser-callable action just by importing it into a client
// component. The client-safe loaders live in lib/loadAppDataV2.ts.
import "server-only";
import { query } from "./db";
import { HrForm } from "@/public/assets";

// Approvers Object
export interface ApproversObject {
  uuid: string;
  name: string;
  email: string;
}

// Load the hr array, scoped to approvers permitted to act on `form`
// (hr_array.hr_forms) - salary advance never calls this, it has its own
// dedicated approver email from the environment.
export const loadHrArray = async (
  form: HrForm,
): Promise<ApproversObject[] | []> => {
  try {
    const result = await query<ApproversObject>(
      `
            SELECT hr_uuid AS uuid,
            hr_name AS name,
            hr_email AS email
            FROM hr_array
            WHERE $1 = ANY(hr_forms)
            `,
      [form],
    );

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
