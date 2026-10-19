"use server";
import { query } from "@/lib/db";
import {
  cleanConfigName,
  ConfigInputError,
  getConfigAdminSession,
  isConfigId,
  recordConfigChange,
  runConfigChange as runChange,
  type ConfigActionResult,
} from "@/lib/configAdminAccess";
import type { CasualBudgetUnit } from "@/lib/casualBudgetRules";

// The Settings page's Casual tab: reads and writes the casual config tables
// (migration 025). Every action re-checks the config-admin role, writes its
// change and a config_changes row in one transaction, then expires the
// GetCasualConfig cache so forms pick the change up on their next load.
// Rows are added and (de)activated, never renamed; rates are added, and
// deleted only before they take effect.

export interface CasualConfigAdminData {
  // Africa/Nairobi date, the date rates are picked by
  today: string;
  departments: string[];
  locations: { id: number; name: string; isActive: boolean }[];
  departmentLocations: { department: string; locationIds: number[] }[];
  sections: {
    id: number;
    department: string;
    name: string;
    budgetUnit: CasualBudgetUnit;
    isActive: boolean;
  }[];
  categories: { id: number; name: string; isActive: boolean }[];
  rates: {
    id: number;
    department: string | null;
    locationId: number | null;
    location: string | null;
    categoryId: number | null;
    category: string | null;
    ratePerDay: number;
    effectiveFrom: string;
    createdByEmail: string | null;
  }[];
  changes: {
    id: string;
    summary: string;
    changedByName: string;
    changedAt: string;
  }[];
}

// Fixed table names, so safe to inline in SQL
const CASUAL_TABLES_SQL = [
  "casual_locations",
  "casual_department_locations",
  "casual_department_sections",
  "casual_categories",
  "casual_rates",
]
  .map((table) => `'${table}'`)
  .join(", ");

const BUDGET_UNITS: CasualBudgetUnit[] = ["default", "warehouse", "bond"];
const MAX_RATE_PER_DAY = 1_000_000;
const NAIROBI_TODAY_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date`;

export async function getCasualConfigAdminData(): Promise<CasualConfigAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [
    [{ today }],
    departments,
    locations,
    departmentLocations,
    sections,
    categories,
    rates,
    changes,
  ] = await Promise.all([
    query<{ today: string }>(
      `SELECT TO_CHAR(${NAIROBI_TODAY_SQL}, 'YYYY-MM-DD') AS today`,
    ),
    query<{ name: string }>(
      `SELECT department_name AS name FROM base_departments
       WHERE is_active = true ORDER BY department_name`,
    ),
    query<{ id: number; name: string; isActive: boolean }>(
      `SELECT id, location_name AS name, is_active AS "isActive"
       FROM casual_locations ORDER BY id`,
    ),
    query<{ department: string; locationIds: number[] }>(
      `SELECT department_name AS department,
       ARRAY_AGG(location_id ORDER BY location_id) AS "locationIds"
       FROM casual_department_locations GROUP BY department_name
       ORDER BY department_name`,
    ),
    query<CasualConfigAdminData["sections"][number]>(
      `SELECT id, department_name AS department, section_name AS name,
       budget_unit AS "budgetUnit", is_active AS "isActive"
       FROM casual_department_sections ORDER BY department_name, id`,
    ),
    query<{ id: number; name: string; isActive: boolean }>(
      `SELECT id, category_name AS name, is_active AS "isActive"
       FROM casual_categories ORDER BY id`,
    ),
    query<CasualConfigAdminData["rates"][number]>(
      `SELECT r.id, r.department_name AS department, r.location_id AS "locationId",
       l.location_name AS location, r.category_id AS "categoryId",
       c.category_name AS category, r.rate_per_day AS "ratePerDay",
       TO_CHAR(r.effective_from, 'YYYY-MM-DD') AS "effectiveFrom",
       r.created_by_email AS "createdByEmail"
       FROM casual_rates r
       LEFT JOIN casual_locations l ON l.id = r.location_id
       LEFT JOIN casual_categories c ON c.id = r.category_id
       ORDER BY r.effective_from DESC, r.id DESC`,
    ),
    query<{
      id: string;
      summary: string;
      changedByName: string;
      changedAt: string;
    }>(
      `SELECT id::text, summary, changed_by_name AS "changedByName",
       TO_CHAR(changed_at AT TIME ZONE 'Africa/Nairobi', 'DD Mon YYYY, HH24:MI') AS "changedAt"
       FROM config_changes WHERE table_name IN (${CASUAL_TABLES_SQL})
       ORDER BY changed_at DESC, id DESC LIMIT 30`,
    ),
  ]);

  return {
    today,
    departments: departments.map((row) => row.name),
    locations,
    departmentLocations,
    sections,
    categories,
    rates,
    changes,
  };
}

// Every casual change expires the config the forms load
const runCasualChange = (
  work: Parameters<typeof runChange>[1],
): Promise<ConfigActionResult> => runChange("GetCasualConfig", work);

// ---- Locations ----

export async function addCasualLocation(name: unknown) {
  return runCasualChange(async (client, actor) => {
    const locationName = cleanConfigName(name, "location");
    const { rows } = await client.query(
      `INSERT INTO casual_locations (location_name) VALUES ($1)
       RETURNING id, location_name, is_active`,
      [locationName],
    );
    await recordConfigChange(client, actor, {
      table: "casual_locations",
      key: rows[0].id,
      action: "create",
      summary: `Added location "${locationName}"`,
      after: rows[0],
    });
    return `Added "${locationName}"`;
  });
}

export async function setCasualLocationActive(id: unknown, isActive: unknown) {
  return setActive(
    "casual_locations",
    "location_name",
    "location",
    id,
    isActive,
  );
}

// Locations a department may use; an empty list removes its limits, so it
// may use every active location
export async function setDepartmentLocationLimits(
  department: unknown,
  locationIds: unknown,
) {
  return runCasualChange(async (client, actor) => {
    if (typeof department !== "string" || !department) {
      throw new ConfigInputError("Choose a department");
    }
    if (!Array.isArray(locationIds) || !locationIds.every(isConfigId)) {
      throw new ConfigInputError("Choose valid locations");
    }
    const ids = [...new Set(locationIds as number[])].sort((a, b) => a - b);

    const { rowCount: departmentExists } = await client.query(
      `SELECT 1 FROM base_departments WHERE department_name = $1`,
      [department],
    );
    if (!departmentExists) throw new ConfigInputError("Choose a department");

    const { rows: chosen } = await client.query<{ location_name: string }>(
      `SELECT location_name FROM casual_locations WHERE id = ANY($1) ORDER BY id`,
      [ids],
    );
    if (chosen.length !== ids.length) {
      throw new ConfigInputError("Choose valid locations");
    }

    const { rows: before } = await client.query<{ location_id: number }>(
      `DELETE FROM casual_department_locations WHERE department_name = $1
       RETURNING location_id`,
      [department],
    );
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO casual_department_locations (department_name, location_id)
         SELECT $1, UNNEST($2::int[])`,
        [department, ids],
      );
    }

    const names = chosen.map((row) => row.location_name).join(", ");
    const summary =
      ids.length > 0
        ? `Limited ${department} to ${names}`
        : `Removed ${department}'s location limits`;
    await recordConfigChange(client, actor, {
      table: "casual_department_locations",
      key: department,
      action: "update",
      summary,
      before: before.map((row) => row.location_id).sort((a, b) => a - b),
      after: ids,
    });
    return summary;
  });
}

// ---- Sections ----

// A department's first section switches it from the single
// "<department>-<location>" section to picking from its sections
export async function addCasualSection(
  department: unknown,
  name: unknown,
  budgetUnit: unknown,
) {
  return runCasualChange(async (client, actor) => {
    const sectionName = cleanConfigName(name, "section");
    if (!BUDGET_UNITS.includes(budgetUnit as CasualBudgetUnit)) {
      throw new ConfigInputError("Choose a budget unit");
    }
    const { rowCount: departmentExists } = await client.query(
      `SELECT 1 FROM base_departments WHERE department_name = $1`,
      [department],
    );
    if (typeof department !== "string" || !departmentExists) {
      throw new ConfigInputError("Choose a department");
    }

    const { rows } = await client.query(
      `INSERT INTO casual_department_sections (department_name, section_name, budget_unit)
       VALUES ($1, $2, $3) RETURNING id, department_name, section_name, budget_unit, is_active`,
      [department, sectionName, budgetUnit],
    );
    await recordConfigChange(client, actor, {
      table: "casual_department_sections",
      key: rows[0].id,
      action: "create",
      summary: `Added section "${sectionName}" to ${department} (${budgetUnit} budget)`,
      after: rows[0],
    });
    return `Added "${sectionName}" to ${department}`;
  });
}

export async function setCasualSectionActive(id: unknown, isActive: unknown) {
  return setActive(
    "casual_department_sections",
    "section_name",
    "section",
    id,
    isActive,
  );
}

// ---- Categories ----

export async function addCasualCategory(name: unknown) {
  return runCasualChange(async (client, actor) => {
    const categoryName = cleanConfigName(name, "category");
    const { rows } = await client.query(
      `INSERT INTO casual_categories (category_name) VALUES ($1)
       RETURNING id, category_name, is_active`,
      [categoryName],
    );
    await recordConfigChange(client, actor, {
      table: "casual_categories",
      key: rows[0].id,
      action: "create",
      summary: `Added category "${categoryName}"`,
      after: rows[0],
    });
    return `Added "${categoryName}"`;
  });
}

export async function setCasualCategoryActive(id: unknown, isActive: unknown) {
  return setActive(
    "casual_categories",
    "category_name",
    "category",
    id,
    isActive,
  );
}

// ---- Rates ----

// A rate takes effect from a future date (Africa/Nairobi), so requisitions
// already open in a form aren't repriced under them on the day it changes
export async function addCasualRate(input: {
  department: string | null;
  locationId: number | null;
  categoryId: number | null;
  ratePerDay: number;
  effectiveFrom: string;
}) {
  return runCasualChange(async (client, actor) => {
    const { department, locationId, categoryId, ratePerDay, effectiveFrom } =
      input ?? {};

    if (
      typeof ratePerDay !== "number" ||
      !Number.isInteger(ratePerDay) ||
      ratePerDay <= 0 ||
      ratePerDay > MAX_RATE_PER_DAY
    ) {
      throw new ConfigInputError("Enter a whole-shilling daily rate above 0");
    }
    if (
      typeof effectiveFrom !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
    ) {
      throw new ConfigInputError("Choose the date the rate takes effect");
    }

    const {
      rows: [check],
    } = await client.query<{
      future: boolean;
      department_ok: boolean;
      location: string | null;
      category: string | null;
    }>(
      `SELECT $1::date > ${NAIROBI_TODAY_SQL} AS future,
       ($2::varchar IS NULL OR EXISTS (
         SELECT 1 FROM base_departments WHERE department_name = $2)) AS department_ok,
       (SELECT location_name FROM casual_locations WHERE id = $3 AND is_active) AS location,
       (SELECT category_name FROM casual_categories WHERE id = $4 AND is_active) AS category`,
      [effectiveFrom, department, locationId, categoryId],
    );

    if (!check.future) {
      throw new ConfigInputError(
        "A new rate must take effect from tomorrow or later",
      );
    }
    if (!check.department_ok) throw new ConfigInputError("Choose a department");
    if (locationId !== null && !check.location) {
      throw new ConfigInputError("Choose an active location");
    }
    if (categoryId !== null && !check.category) {
      throw new ConfigInputError("Choose an active category");
    }

    const { rows } = await client
      .query(
        `INSERT INTO casual_rates
       (department_name, location_id, category_id, rate_per_day, effective_from, created_by_email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, department_name, location_id, category_id, rate_per_day,
       TO_CHAR(effective_from, 'YYYY-MM-DD') AS effective_from`,
        [
          department,
          locationId,
          categoryId,
          ratePerDay,
          effectiveFrom,
          actor.email,
        ],
      )
      .catch((error) => {
        if (error.code === "23505") {
          throw new ConfigInputError(
            "A rate for this department, location and category already starts on that date",
          );
        }
        throw error;
      });

    const scope =
      [department, check.location, check.category]
        .filter(Boolean)
        .join(" · ") || "all other cases";
    const summary = `Added rate KES ${ratePerDay.toLocaleString()} for ${scope} from ${effectiveFrom}`;
    await recordConfigChange(client, actor, {
      table: "casual_rates",
      key: rows[0].id,
      action: "create",
      summary,
      after: rows[0],
    });
    return summary;
  });
}

// Only a rate that hasn't taken effect yet - one that has may already have
// priced requisitions
export async function deleteCasualRate(id: unknown) {
  return runCasualChange(async (client, actor) => {
    if (!isConfigId(id)) throw new ConfigInputError("Choose a rate");

    const { rows } = await client.query(
      `DELETE FROM casual_rates r
       WHERE r.id = $1 AND r.effective_from > ${NAIROBI_TODAY_SQL}
       RETURNING r.id, r.department_name, r.location_id, r.category_id, r.rate_per_day,
       TO_CHAR(r.effective_from, 'YYYY-MM-DD') AS effective_from`,
      [id],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "Only a rate that hasn't taken effect yet can be deleted",
      );
    }

    const summary = `Deleted the scheduled KES ${Number(rows[0].rate_per_day).toLocaleString()} rate from ${rows[0].effective_from}`;
    await recordConfigChange(client, actor, {
      table: "casual_rates",
      key: id,
      action: "delete",
      summary,
      before: rows[0],
    });
    return summary;
  });
}

// ---- Shared ----

async function setActive(
  table:
    | "casual_locations"
    | "casual_department_sections"
    | "casual_categories",
  nameColumn: string,
  label: string,
  id: unknown,
  isActive: unknown,
) {
  return runCasualChange(async (client, actor) => {
    if (!isConfigId(id) || typeof isActive !== "boolean") {
      throw new ConfigInputError(`Choose a ${label}`);
    }

    const { rows } = await client.query(
      `UPDATE ${table} SET is_active = $2 WHERE id = $1 AND is_active <> $2
       RETURNING id, ${nameColumn} AS name`,
      [id, isActive],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        `That ${label} was already ${isActive ? "active" : "inactive"} - reload to see the latest`,
      );
    }

    const verb = isActive ? "Reactivated" : "Deactivated";
    const summary = `${verb} ${label} "${rows[0].name}"`;
    await recordConfigChange(client, actor, {
      table,
      key: id,
      action: "update",
      summary,
      before: { is_active: !isActive },
      after: { is_active: isActive },
    });
    return summary;
  });
}
