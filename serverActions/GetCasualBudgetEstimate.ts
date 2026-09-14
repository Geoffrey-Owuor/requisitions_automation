"use server";

import { query } from "@/lib/db";
import {
  CasualBudgetUnit,
  getBudgetUnitForSection,
  getFinancialYear,
  getFinancialYearDateRange,
  getFinancialYearMonths,
  toLocalDate,
} from "@/lib/casualBudgetRules";

// No session/auth check here on purpose: this is read-only budget aggregate
// data (no PII), and it's called both from the authenticated submission
// flow and from the public per-UUID casual approval page (no session there).

export interface CasualBudgetSectionInput {
  sectionName: string;
  numberOfCasuals: number;
  totalAmount: number; // basic amount only - rate/day * days * casuals
  // ISO "yyyy-mm-dd" from a client date-input, or a Date instance when this
  // came off a DB row (see toLocalDate() in lib/casualBudgetRules.ts)
  periodFrom: string | Date;
}

export interface CasualBudgetEstimateInput {
  department: string;
  sections: CasualBudgetSectionInput[];
}

export interface CasualBudgetMonthLine {
  calendarMonth: number;
  calendarYear: number;
  budgetAmount: number;
  approvedSpend: number;
  pendingAddition: number;
  projectedSpend: number;
}

export interface CasualBudgetUnitEstimate {
  unit: CasualBudgetUnit;
  financialYear: string;
  statutoryCostPerCasual: number;
  monthly: CasualBudgetMonthLine[];
  yearly: {
    budgetAmount: number;
    approvedSpend: number;
    baselineAmount: number;
    pendingAddition: number;
    projectedSpend: number;
  };
}

// A submission's sections are grouped by (budget unit, financial year) -
// almost always a single group, but a submission whose sections' engagement
// periods straddle Operations' Bond/Warehouse split and/or a FY boundary
// gets one estimate per group rather than conflating them.
function groupSectionsByUnitAndFY(
  department: string,
  sections: CasualBudgetSectionInput[],
) {
  const groups = new Map<
    string,
    { unit: CasualBudgetUnit; financialYear: string; sections: CasualBudgetSectionInput[] }
  >();

  for (const section of sections) {
    if (!section.periodFrom) continue;
    const unit = getBudgetUnitForSection(department, section.sectionName);
    const financialYear = getFinancialYear(toLocalDate(section.periodFrom));
    const key = `${unit}::${financialYear}`;
    const group = groups.get(key) ?? { unit, financialYear, sections: [] };
    group.sections.push(section);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

export async function getCasualBudgetEstimate({
  department,
  sections,
}: CasualBudgetEstimateInput): Promise<CasualBudgetUnitEstimate[]> {
  if (!department || sections.length === 0) return [];

  const groups = groupSectionsByUnitAndFY(department, sections);

  return Promise.all(
    groups.map(async ({ unit, financialYear, sections: groupSections }) => {
      const { start, end } = getFinancialYearDateRange(financialYear);

      const [budgetRows, statutoryRows, baselineRows] = await Promise.all([
        query<{ budget_month: number; budget_amount: string }>(
          `SELECT budget_month, budget_amount FROM casual_department_budgets
           WHERE department_name = $1 AND budget_unit = $2 AND financial_year = $3`,
          [department, unit, financialYear],
        ),
        query<{ statutory_cost_per_casual: string }>(
          `SELECT statutory_cost_per_casual FROM casual_department_statutory_costs
           WHERE department_name = $1 AND financial_year = $2`,
          [department, financialYear],
        ),
        query<{ baseline_amount: string }>(
          `SELECT baseline_amount FROM casual_department_baseline_spend
           WHERE department_name = $1 AND budget_unit = $2 AND financial_year = $3`,
          [department, unit, financialYear],
        ),
      ]);

      const statutoryCostPerCasual = Number(
        statutoryRows[0]?.statutory_cost_per_casual ?? 0,
      );

      const spendRows = await query<{
        calendar_month: number;
        spend: string;
      }>(
        `SELECT
           EXTRACT(MONTH FROM s.engagement_period_from)::int AS calendar_month,
           SUM(s.casual_total_amount + s.number_of_casuals * $4::numeric) AS spend
         FROM casual_requisition_sections s
         JOIN casual_requisitions c ON c.request_id = s.request_id
         WHERE c.employee_department = $1
           AND c.casual_hod_approval_status = 'approved'
           AND c.casual_hr_approval_status = 'approved'
           AND s.engagement_period_from BETWEEN $2 AND $3
           AND (
             $5 = 'default'
             OR ($5 = 'bond' AND s.section_name = 'Bond')
             OR ($5 = 'warehouse' AND s.section_name != 'Bond')
           )
         GROUP BY 1`,
        [department, start, end, statutoryCostPerCasual, unit],
      );

      const budgetByMonth = new Map(
        budgetRows.map((row) => [row.budget_month, Number(row.budget_amount)]),
      );
      const approvedSpendByMonth = new Map(
        spendRows.map((row) => [row.calendar_month, Number(row.spend)]),
      );
      const pendingByMonth = new Map<number, number>();
      for (const section of groupSections) {
        const month = toLocalDate(section.periodFrom).getMonth() + 1;
        const cost =
          section.totalAmount +
          section.numberOfCasuals * statutoryCostPerCasual;
        pendingByMonth.set(month, (pendingByMonth.get(month) ?? 0) + cost);
      }

      const monthly: CasualBudgetMonthLine[] = getFinancialYearMonths(
        financialYear,
      ).map(({ calendarMonth, calendarYear }) => {
        const budgetAmount = budgetByMonth.get(calendarMonth) ?? 0;
        const approvedSpend = approvedSpendByMonth.get(calendarMonth) ?? 0;
        const pendingAddition = pendingByMonth.get(calendarMonth) ?? 0;
        return {
          calendarMonth,
          calendarYear,
          budgetAmount,
          approvedSpend,
          pendingAddition,
          projectedSpend: approvedSpend + pendingAddition,
        };
      });

      const baselineAmount = Number(baselineRows[0]?.baseline_amount ?? 0);
      const yearlyApprovedSpend = monthly.reduce(
        (sum, m) => sum + m.approvedSpend,
        0,
      );
      const yearlyPendingAddition = monthly.reduce(
        (sum, m) => sum + m.pendingAddition,
        0,
      );

      return {
        unit,
        financialYear,
        statutoryCostPerCasual,
        monthly,
        yearly: {
          budgetAmount: monthly.reduce((sum, m) => sum + m.budgetAmount, 0),
          approvedSpend: yearlyApprovedSpend,
          baselineAmount,
          pendingAddition: yearlyPendingAddition,
          projectedSpend:
            yearlyApprovedSpend + baselineAmount + yearlyPendingAddition,
        },
      };
    }),
  );
}
