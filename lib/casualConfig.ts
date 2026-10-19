import type { CasualBudgetUnit } from "@/lib/casualBudgetRules";

// Casual requisition config (migration 025_casual_config.sql), loaded by
// lib/loadCasualConfig.ts. Client-safe: the form and the server both apply
// these rules to the same config, so the estimate a submitter sees and the
// figure the server stores can't drift apart.

export interface CasualRateRule {
  department: string | null; // null = any
  location: string | null;
  category: string | null;
  ratePerDay: number;
  effectiveFrom: string; // YYYY-MM-DD
}

export interface CasualConfig {
  locations: { name: string; isActive: boolean }[];
  // Departments limited to some locations; any other uses every active one
  departmentLocations: Record<string, string[]>;
  sections: {
    department: string;
    name: string;
    budgetUnit: CasualBudgetUnit;
    isActive: boolean;
  }[];
  categories: { name: string; isActive: boolean }[];
  // Every rule, future-dated ones included - resolveCasualRate picks by date
  rates: CasualRateRule[];
}

// Today's date in Africa/Nairobi as YYYY-MM-DD, the date rates are picked by
export function nairobiToday(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

// Locations offered for a department: its limits if it has any, otherwise
// every active location
export function getCasualLocationsForDepartment(
  config: CasualConfig,
  department: string,
): string[] {
  const active = config.locations
    .filter((location) => location.isActive)
    .map((location) => location.name);
  const allowed = config.departmentLocations[department];

  return allowed ? active.filter((name) => allowed.includes(name)) : active;
}

// Whether a location may be picked for a department right now
export function isCasualLocationAllowed(
  config: CasualConfig,
  department: string,
  location: string,
): boolean {
  return getCasualLocationsForDepartment(config, department).includes(location);
}

// Section names offered for a department/location: its configured sections
// if it has any, otherwise a single "<department>-<location>" section
export function getCasualSections(
  config: CasualConfig,
  department: string,
  location: string,
): string[] {
  if (!department || !location) return [];

  const configured = config.sections.filter(
    (section) => section.department === department,
  );
  if (configured.length === 0) return [`${department}-${location}`];

  return configured
    .filter((section) => section.isActive)
    .map((section) => section.name);
}

// The casual budget a section counts against. Inactive sections still map,
// since requisitions that used them stay in the budget figures.
export function getBudgetUnitForSection(
  config: CasualConfig,
  department: string,
  sectionName: string,
): CasualBudgetUnit {
  return (
    config.sections.find(
      (section) =>
        section.department === department && section.name === sectionName,
    )?.budgetUnit ?? "default"
  );
}

export function getActiveCasualCategories(config: CasualConfig): string[] {
  return config.categories
    .filter((category) => category.isActive)
    .map((category) => category.name);
}

// The daily rate for a requisition on `date`, or null when no rule matches.
// The most specific matching rule wins - department beats location beats
// category - then the latest effective_from on or before `date`.
export function resolveCasualRate(
  rates: CasualRateRule[],
  {
    department,
    location,
    category,
    date,
  }: {
    department: string;
    location: string;
    category: string | null;
    date: string;
  },
): number | null {
  const specificity = (rule: CasualRateRule) =>
    (rule.department ? 4 : 0) + (rule.location ? 2 : 0) + (rule.category ? 1 : 0);

  const matches = rates.filter(
    (rule) =>
      rule.effectiveFrom <= date &&
      (rule.department === null || rule.department === department) &&
      (rule.location === null || rule.location === location) &&
      (rule.category === null || rule.category === category),
  );

  matches.sort(
    (a, b) =>
      specificity(b) - specificity(a) ||
      b.effectiveFrom.localeCompare(a.effectiveFrom),
  );

  return matches[0]?.ratePerDay ?? null;
}

// The rules in effect on `date` (the latest of each scope), the general
// default first and the most specific last - for listing the current rates
export function currentCasualRates(
  rates: CasualRateRule[],
  date: string,
): CasualRateRule[] {
  const latest = new Map<string, CasualRateRule>();

  for (const rule of rates) {
    if (rule.effectiveFrom > date) continue;
    const key = `${rule.department}|${rule.location}|${rule.category}`;
    const existing = latest.get(key);
    if (!existing || existing.effectiveFrom < rule.effectiveFrom) {
      latest.set(key, rule);
    }
  }

  const specificity = (rule: CasualRateRule) =>
    (rule.department ? 4 : 0) + (rule.location ? 2 : 0) + (rule.category ? 1 : 0);

  return [...latest.values()].sort((a, b) => specificity(a) - specificity(b));
}

// "Engineering & HVAC · Ruiru · Welder", or "All other cases" for the default
export function describeCasualRateScope(rule: CasualRateRule): string {
  const parts = [rule.department, rule.location, rule.category].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "All other cases";
}
