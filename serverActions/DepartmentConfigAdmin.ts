"use server";
import { query } from "@/lib/db";
import {
  DEPARTMENT_FLAGS,
  type DepartmentFlag,
  isDepartmentFlag,
} from "@/lib/departmentFlags";
import {
  cleanConfigName,
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  isConfigId,
  loadConfigChanges,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Departments tab: base_departments and its flag
// columns (migrations 024, 025). Departments are added and (de)activated,
// never renamed or deleted - requisitions store the name as text. Every
// form reads the list through the GetBaseDepartments cache tag.

const TAG = "GetBaseDepartments";

export interface AdminDepartment {
  id: number;
  name: string;
  isActive: boolean;
  flags: Record<DepartmentFlag, boolean>;
  // Selectable HODs auto-selected for it (hod_array.hod_department)
  hodNames: string[];
}

export interface DepartmentAdminData {
  departments: AdminDepartment[];
  changes: ConfigChangeRow[];
}

export async function getDepartmentAdminData(): Promise<DepartmentAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [rows, changes] = await Promise.all([
    query<{
      id: number;
      name: string;
      isActive: boolean;
      hodNames: string[];
      requires_retail_director: boolean;
      casual_category_required: boolean;
      requires_engineering_jobs: boolean;
    }>(
      `SELECT d.id, d.department_name AS name, d.is_active AS "isActive",
       d.requires_retail_director, d.casual_category_required,
       d.requires_engineering_jobs,
       COALESCE(ARRAY_AGG(h.hod_name ORDER BY h.hod_name)
         FILTER (WHERE h.id IS NOT NULL), '{}') AS "hodNames"
       FROM base_departments d
       LEFT JOIN hod_array h
         ON h.hod_department = d.department_name AND NOT h.is_alternate_only
       GROUP BY d.id ORDER BY d.department_name`,
    ),
    loadConfigChanges(["base_departments"]),
  ]);

  return {
    departments: rows.map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      hodNames: row.hodNames,
      flags: {
        requires_retail_director: row.requires_retail_director,
        casual_category_required: row.casual_category_required,
        requires_engineering_jobs: row.requires_engineering_jobs,
      },
    })),
    changes,
  };
}

export async function addDepartment(name: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    const departmentName = cleanConfigName(name, "department");

    const { rows } = await client.query(
      `INSERT INTO base_departments (department_name) VALUES ($1)
       ON CONFLICT (department_name) DO NOTHING
       RETURNING id, department_name, is_active, requires_retail_director,
       casual_category_required, requires_engineering_jobs`,
      [departmentName],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(`"${departmentName}" already exists`);
    }

    await recordConfigChange(client, actor, {
      table: "base_departments",
      key: rows[0].id,
      action: "create",
      summary: `Added department "${departmentName}"`,
      after: rows[0],
    });
    return `Added "${departmentName}"`;
  });
}

export async function setDepartmentActive(id: unknown, isActive: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    if (!isConfigId(id) || typeof isActive !== "boolean") {
      throw new ConfigInputError("Choose a department");
    }

    const { rows } = await client.query(
      `UPDATE base_departments SET is_active = $2
       WHERE id = $1 AND is_active <> $2 RETURNING department_name AS name`,
      [id, isActive],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        `That department was already ${isActive ? "active" : "inactive"} - reload to see the latest`,
      );
    }

    const summary = `${isActive ? "Reactivated" : "Deactivated"} department "${rows[0].name}"`;
    await recordConfigChange(client, actor, {
      table: "base_departments",
      key: id,
      action: "update",
      summary,
      before: { is_active: !isActive },
      after: { is_active: isActive },
    });
    return summary;
  });
}

export async function setDepartmentFlag(
  id: unknown,
  flag: unknown,
  value: unknown,
) {
  return runConfigChange(TAG, async (client, actor) => {
    if (
      !isConfigId(id) ||
      !isDepartmentFlag(flag) ||
      typeof value !== "boolean"
    ) {
      throw new ConfigInputError("Choose a department and a setting");
    }
    const column = flag;
    const label = DEPARTMENT_FLAGS.find((entry) => entry.key === flag)!.summary;

    const { rows } = await client.query(
      `UPDATE base_departments SET ${column} = $2
       WHERE id = $1 AND ${column} <> $2 RETURNING department_name AS name`,
      [id, value],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "Nothing to change - reload to see the latest",
      );
    }

    const summary = `"${rows[0].name}" ${value ? "now" : "no longer"} ${label}`;
    await recordConfigChange(client, actor, {
      table: "base_departments",
      key: id,
      action: "update",
      summary,
      before: { [column]: !value },
      after: { [column]: value },
    });
    return summary;
  });
}
