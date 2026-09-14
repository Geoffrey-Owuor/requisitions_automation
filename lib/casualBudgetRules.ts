import { OPERATIONS_DEPARTMENT } from "@/public/assets";

// Shared between the confirmation-step estimate (client, in-progress form
// data) and the approval-modal estimate (persisted requisition data) so both
// derive financial years and budget units identically.

export type CasualBudgetUnit = "default" | "warehouse" | "bond";

// Section dates arriving from a client date-input are plain "YYYY-MM-DD"
// strings, but the same field read back off a DB row (via Postgres's date
// type parser, then serialized as a Server Component prop or a server
// action argument) comes through as a real Date instance despite the
// declared `string` type - mirrors why engagementDaysBetween() in
// casualRequisitionRules.ts appends "T00:00:00" rather than trusting
// `new Date(dateString)` alone.
export function toLocalDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value + "T00:00:00");
}

// Financial year runs April -> March; the key names the calendar year its
// April falls in, e.g. a date in Feb 2027 is in FY "2026-2027".
export function getFinancialYear(date: Date): string {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

// The (calendar month, calendar year) pair for each of the 12 months an FY
// key spans, in Apr -> Mar order.
export function getFinancialYearMonths(
  financialYear: string,
): { calendarMonth: number; calendarYear: number }[] {
  const startYear = Number(financialYear.split("-")[0]);
  return Array.from({ length: 12 }, (_, i) => {
    const calendarMonth = ((3 + i) % 12) + 1; // 4,5,...,12,1,2,3
    const calendarYear = calendarMonth >= 4 ? startYear : startYear + 1;
    return { calendarMonth, calendarYear };
  });
}

// The first and last calendar date (inclusive) an FY key spans.
export function getFinancialYearDateRange(financialYear: string): {
  start: string;
  end: string;
} {
  const startYear = Number(financialYear.split("-")[0]);
  return { start: `${startYear}-04-01`, end: `${startYear + 1}-03-31` };
}

// Only Operations splits its budget - into 'warehouse' (every section except
// Bond) and 'bond' (the Bond section). Every other department is 'default'.
export function getBudgetUnitForSection(
  department: string,
  sectionName: string,
): CasualBudgetUnit {
  if (department !== OPERATIONS_DEPARTMENT) return "default";
  return sectionName === "Bond" ? "bond" : "warehouse";
}
