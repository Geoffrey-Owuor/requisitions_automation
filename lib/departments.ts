import "server-only";
import { PoolClient } from "pg";
import { query } from "@/lib/db";

// Department flags (base_departments, migration 024_department_flags.sql).
// Behaviour is keyed on these flags, never on department names in code.
export interface DepartmentRules {
  requiresRetailDirector: boolean;
}

export const INVALID_DEPARTMENT_MESSAGE =
  "The selected department is not available, please select another department";

// Resolves a submitted department to its rules, or null when it may not be
// used: unknown, or inactive. An amendment passes the department its
// requisition already has as `currentDepartment`, so it can keep that one
// even after it was made inactive. Pass the transaction's client when the
// caller holds one.
export async function resolveDepartment(
  department: unknown,
  {
    currentDepartment = null,
    client = null,
  }: {
    currentDepartment?: string | null;
    client?: Pick<PoolClient, "query"> | null;
  } = {},
): Promise<DepartmentRules | null> {
  if (typeof department !== "string" || !department.trim()) return null;

  const sql = `
    SELECT is_active, requires_retail_director
    FROM base_departments WHERE department_name = $1 LIMIT 1
  `;
  type Row = { is_active: boolean; requires_retail_director: boolean };
  const rows = client
    ? (await client.query<Row>(sql, [department])).rows
    : await query<Row>(sql, [department]);

  const row = rows[0];
  if (!row) return null;
  if (!row.is_active && department !== currentDepartment) return null;

  return { requiresRetailDirector: row.requires_retail_director };
}
