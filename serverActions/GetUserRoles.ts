import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export type Roles = string[];

interface QueryRoles {
  role_name: string;
}

export async function getUserRoles(email: string): Promise<Roles> {
  const user = await getSession();
  if (!user) return ["user"];
  try {
    const baseQuery = `
    SELECT r.role_name
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE u.email = $1
    `;

    const result = await query<QueryRoles>(baseQuery, [email]);

    // Filter to remove null values
    const flattenedRoles = result
      .map((row) => row.role_name)
      .filter((role) => role !== null);

    return flattenedRoles.length > 0 ? flattenedRoles : ["user"];
  } catch (error) {
    console.error("Error while trying to get the user roles:", error);
    return ["user"];
  }
}
