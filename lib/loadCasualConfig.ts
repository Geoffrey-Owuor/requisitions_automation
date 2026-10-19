import "server-only";
import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import type { CasualConfig, CasualRateRule } from "@/lib/casualConfig";
import type { CasualBudgetUnit } from "@/lib/casualBudgetRules";

// The whole casual config (migration 025_casual_config.sql), inactive rows
// and future-dated rates included - callers filter. Cached under the
// GetCasualConfig tag; refresh it after editing the tables by hand. Throws
// if the database can't be read, so a submission never gets priced against
// an empty config.
export const loadCasualConfig = unstable_cache(
  async (): Promise<CasualConfig> => {
    const [locations, departmentLocations, sections, categories, rates] =
      await Promise.all([
        query<{ name: string; is_active: boolean }>(
          `SELECT location_name AS name, is_active FROM casual_locations ORDER BY id`,
        ),
        query<{ department_name: string; location_name: string }>(
          `SELECT dl.department_name, l.location_name
           FROM casual_department_locations dl
           JOIN casual_locations l ON l.id = dl.location_id`,
        ),
        query<{
          department_name: string;
          section_name: string;
          budget_unit: CasualBudgetUnit;
          is_active: boolean;
        }>(
          `SELECT department_name, section_name, budget_unit, is_active
           FROM casual_department_sections ORDER BY id`,
        ),
        query<{ name: string; is_active: boolean }>(
          `SELECT category_name AS name, is_active FROM casual_categories ORDER BY id`,
        ),
        query<{
          department_name: string | null;
          location_name: string | null;
          category_name: string | null;
          rate_per_day: number;
          effective_from: string;
        }>(
          `SELECT r.department_name, l.location_name, c.category_name, r.rate_per_day,
           TO_CHAR(r.effective_from, 'YYYY-MM-DD') AS effective_from
           FROM casual_rates r
           LEFT JOIN casual_locations l ON l.id = r.location_id
           LEFT JOIN casual_categories c ON c.id = r.category_id`,
        ),
      ]);

    const limits: Record<string, string[]> = {};
    for (const row of departmentLocations) {
      (limits[row.department_name] ??= []).push(row.location_name);
    }

    return {
      locations: locations.map((row) => ({
        name: row.name,
        isActive: row.is_active,
      })),
      departmentLocations: limits,
      sections: sections.map((row) => ({
        department: row.department_name,
        name: row.section_name,
        budgetUnit: row.budget_unit,
        isActive: row.is_active,
      })),
      categories: categories.map((row) => ({
        name: row.name,
        isActive: row.is_active,
      })),
      rates: rates.map(
        (row): CasualRateRule => ({
          department: row.department_name,
          location: row.location_name,
          category: row.category_name,
          ratePerDay: row.rate_per_day,
          effectiveFrom: row.effective_from,
        }),
      ),
    };
  },
  ["casual_config"],
  {
    revalidate: 3600,
    tags: ["GetCasualConfig"],
  },
);
