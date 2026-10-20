"use server";
import type { Pool, PoolClient } from "pg";
import { pool, query } from "@/lib/db";
import { nairobiToday } from "@/lib/casualConfig";
import {
  type CasualBudgetUnit,
  getFinancialYear,
  toLocalDate,
} from "@/lib/casualBudgetRules";
import {
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  loadConfigChanges,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Casual budgets tab: per financial year (Apr-Mar,
// "2026-2027"), each department's monthly budget per budget unit, its
// statutory cost per casual and the one-time baseline spend (migration
// 012). Only the budget estimate shown on casual requisitions reads these,
// uncached, so no tag is expired. A department's budget units are those of
// its casual sections, or "default" when it has none.

const BUDGET_TABLES = [
  "casual_department_budgets",
  "casual_department_statutory_costs",
  "casual_department_baseline_spend",
];
const MAX_AMOUNT = 1_000_000_000;

export interface DepartmentBudget {
  department: string;
  units: CasualBudgetUnit[];
  // Apr -> Mar, null where no row exists
  months: Record<string, (number | null)[]>;
  baselines: Record<string, number | null>;
  statutory: number | null;
}

export interface CasualBudgetAdminData {
  financialYear: string;
  currentFinancialYear: string;
  financialYears: string[];
  departments: DepartmentBudget[];
  changes: ConfigChangeRow[];
}

const FY_PATTERN = /^(\d{4})-(\d{4})$/;
const isFinancialYear = (value: unknown): value is string => {
  const match = typeof value === "string" ? FY_PATTERN.exec(value) : null;
  return !!match && Number(match[2]) === Number(match[1]) + 1;
};
const shiftYear = (financialYear: string, by: number) => {
  const start = Number(financialYear.slice(0, 4)) + by;
  return `${start}-${start + 1}`;
};
// Calendar month (1-12) of each Apr -> Mar slot
const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

// Every department's budget units, from its casual sections
async function loadDepartmentUnits(
  client: Pool | PoolClient,
  department?: string,
) {
  const { rows } = await client.query<{
    department: string;
    units: CasualBudgetUnit[];
  }>(
    `SELECT d.department_name AS department,
     COALESCE(ARRAY_AGG(DISTINCT s.budget_unit::text)
       FILTER (WHERE s.id IS NOT NULL), ARRAY['default']) AS units
     FROM base_departments d
     LEFT JOIN casual_department_sections s ON s.department_name = d.department_name
     WHERE d.is_active OR d.department_name = $1
     GROUP BY d.department_name ORDER BY d.department_name`,
    [department ?? null],
  );
  return rows;
}

export async function getCasualBudgetAdminData(
  requestedYear?: unknown,
): Promise<CasualBudgetAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const currentFinancialYear = getFinancialYear(toLocalDate(nairobiToday()));
  const financialYear = isFinancialYear(requestedYear)
    ? requestedYear
    : currentFinancialYear;

  const [units, budgets, statutory, baselines, years, changes] =
    await Promise.all([
      loadDepartmentUnits(pool),
      query<{
        department: string;
        unit: string;
        month: number;
        amount: string;
      }>(
        `SELECT department_name AS department, budget_unit AS unit,
         budget_month AS month, budget_amount AS amount
         FROM casual_department_budgets WHERE financial_year = $1`,
        [financialYear],
      ),
      query<{ department: string; amount: string }>(
        `SELECT department_name AS department, statutory_cost_per_casual AS amount
         FROM casual_department_statutory_costs WHERE financial_year = $1`,
        [financialYear],
      ),
      query<{ department: string; unit: string; amount: string }>(
        `SELECT department_name AS department, budget_unit AS unit,
         baseline_amount AS amount
         FROM casual_department_baseline_spend WHERE financial_year = $1`,
        [financialYear],
      ),
      query<{ year: string }>(
        `SELECT financial_year AS year FROM casual_department_budgets
         UNION SELECT financial_year FROM casual_department_statutory_costs
         UNION SELECT financial_year FROM casual_department_baseline_spend`,
      ),
      loadConfigChanges(BUDGET_TABLES),
    ]);

  const departments = units.map(({ department, units: deptUnits }) => {
    const months: DepartmentBudget["months"] = {};
    const deptBaselines: DepartmentBudget["baselines"] = {};
    for (const unit of deptUnits) {
      months[unit] = MONTH_ORDER.map((month) => {
        const row = budgets.find(
          (b) =>
            b.department === department && b.unit === unit && b.month === month,
        );
        return row ? Number(row.amount) : null;
      });
      const baseline = baselines.find(
        (b) => b.department === department && b.unit === unit,
      );
      deptBaselines[unit] = baseline ? Number(baseline.amount) : null;
    }
    const cost = statutory.find((s) => s.department === department);
    return {
      department,
      units: deptUnits,
      months,
      baselines: deptBaselines,
      statutory: cost ? Number(cost.amount) : null,
    };
  });

  const financialYears = [
    ...new Set([
      shiftYear(currentFinancialYear, -1),
      currentFinancialYear,
      shiftYear(currentFinancialYear, 1),
      ...years.map((row) => row.year),
    ]),
  ].sort();

  return {
    financialYear,
    currentFinancialYear,
    financialYears,
    departments,
    changes,
  };
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= MAX_AMOUNT &&
  Math.round(value * 100) === value * 100;

const isAmountOrNull = (value: unknown): value is number | null =>
  value === null || isAmount(value);

// Saves one department's figures for one financial year. A null month,
// baseline or statutory cost removes that row (no budget set).
export async function saveCasualDepartmentBudget(input: {
  department?: unknown;
  financialYear?: unknown;
  months?: unknown;
  baselines?: unknown;
  statutory?: unknown;
}) {
  return runConfigChange(null, async (client, actor) => {
    const { department, financialYear, months, baselines, statutory } =
      input ?? {};
    if (typeof department !== "string" || !isFinancialYear(financialYear)) {
      throw new ConfigInputError("Choose a department and a financial year");
    }
    const [entry] = (await loadDepartmentUnits(client, department)).filter(
      (row) => row.department === department,
    );
    if (!entry) throw new ConfigInputError("Choose a listed department");

    const monthInput = (months ?? {}) as Record<string, unknown>;
    const baselineInput = (baselines ?? {}) as Record<string, unknown>;
    for (const unit of entry.units) {
      const values = monthInput[unit];
      if (
        !Array.isArray(values) ||
        values.length !== 12 ||
        !values.every(isAmountOrNull)
      ) {
        throw new ConfigInputError(
          "Enter each month's budget in shillings, or leave it empty",
        );
      }
      if (!isAmountOrNull(baselineInput[unit] ?? null)) {
        throw new ConfigInputError("Enter the baseline spend in shillings");
      }
    }
    if (!isAmountOrNull(statutory ?? null)) {
      throw new ConfigInputError("Enter the statutory cost in shillings");
    }

    const before = await snapshot(client, department, financialYear);

    for (const unit of entry.units) {
      const values = monthInput[unit] as (number | null)[];
      for (const [index, amount] of values.entries()) {
        const month = MONTH_ORDER[index];
        if (amount === null) {
          await client.query(
            `DELETE FROM casual_department_budgets
             WHERE department_name = $1 AND budget_unit = $2
             AND financial_year = $3 AND budget_month = $4`,
            [department, unit, financialYear, month],
          );
        } else {
          await client.query(
            `INSERT INTO casual_department_budgets
             (department_name, budget_unit, financial_year, budget_month, budget_amount)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (department_name, budget_unit, financial_year, budget_month)
             DO UPDATE SET budget_amount = EXCLUDED.budget_amount`,
            [department, unit, financialYear, month, amount],
          );
        }
      }

      const baseline = (baselineInput[unit] ?? null) as number | null;
      if (baseline === null) {
        await client.query(
          `DELETE FROM casual_department_baseline_spend
           WHERE department_name = $1 AND budget_unit = $2 AND financial_year = $3`,
          [department, unit, financialYear],
        );
      } else {
        await client.query(
          `INSERT INTO casual_department_baseline_spend
           (department_name, budget_unit, financial_year, baseline_amount)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (department_name, budget_unit, financial_year)
           DO UPDATE SET baseline_amount = EXCLUDED.baseline_amount`,
          [department, unit, financialYear, baseline],
        );
      }
    }

    if (statutory === null || statutory === undefined) {
      await client.query(
        `DELETE FROM casual_department_statutory_costs
         WHERE department_name = $1 AND financial_year = $2`,
        [department, financialYear],
      );
    } else {
      await client.query(
        `INSERT INTO casual_department_statutory_costs
         (department_name, financial_year, statutory_cost_per_casual)
         VALUES ($1, $2, $3)
         ON CONFLICT (department_name, financial_year)
         DO UPDATE SET statutory_cost_per_casual = EXCLUDED.statutory_cost_per_casual`,
        [department, financialYear, statutory],
      );
    }

    const after = await snapshot(client, department, financialYear);
    if (JSON.stringify(before) === JSON.stringify(after)) {
      throw new ConfigInputError("Nothing to save - no figure changed");
    }

    const summary = `Updated the ${financialYear} casual budget of ${department}`;
    await recordConfigChange(client, actor, {
      table: "casual_department_budgets",
      key: `${department}:${financialYear}`,
      action: "update",
      summary,
      before,
      after,
    });
    return summary;
  });
}

// One department's figures for one FY, for the audit row
async function snapshot(
  client: PoolClient,
  department: string,
  financialYear: string,
) {
  const [budgets, statutory, baselines] = await Promise.all([
    client.query(
      `SELECT budget_unit, budget_month, budget_amount FROM casual_department_budgets
       WHERE department_name = $1 AND financial_year = $2
       ORDER BY budget_unit, budget_month`,
      [department, financialYear],
    ),
    client.query(
      `SELECT statutory_cost_per_casual FROM casual_department_statutory_costs
       WHERE department_name = $1 AND financial_year = $2`,
      [department, financialYear],
    ),
    client.query(
      `SELECT budget_unit, baseline_amount FROM casual_department_baseline_spend
       WHERE department_name = $1 AND financial_year = $2 ORDER BY budget_unit`,
      [department, financialYear],
    ),
  ]);
  return {
    budgets: budgets.rows,
    statutory: statutory.rows[0]?.statutory_cost_per_casual ?? null,
    baselines: baselines.rows,
  };
}
