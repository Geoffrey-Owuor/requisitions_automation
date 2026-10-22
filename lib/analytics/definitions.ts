import {
  BriefcaseBusiness,
  ChartColumnBig,
  HardHat,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { getReportRangeError } from "@/lib/reports/definitions";

// The analytics dashboards on the dashboard's Analytics page. Shared by the
// pages (what to offer), the nav (whether to show the link) and the data
// route (app/api/analytics/[type]), which re-checks the role on every
// request. Each dashboard has its own role — see migration
// 035_analytics_roles.sql — and owner, approver, report and config-admin
// roles don't unlock one by themselves. Client-safe.

// The Analytics page, as the sidebar, mobile drawer and app launcher link it
export const ANALYTICS_PAGE = {
  href: "/dashboard/analytics",
  label: "Analytics",
  Icon: ChartColumnBig,
};

// Migration 035 also seeds analytics-it; its dashboard joins this list
// when it's built. Listed in the nav's order.
export type AnalyticsType = "travel" | "casual" | "employee";

export type AnalyticsDefinition = {
  type: AnalyticsType;
  label: string;
  role: string;
  Icon: LucideIcon;
};

export const ANALYTICS: AnalyticsDefinition[] = [
  {
    type: "travel",
    label: "Travel",
    role: "analytics-travel",
    Icon: BriefcaseBusiness,
  },
  {
    type: "casual",
    label: "Casual",
    role: "analytics-casual",
    Icon: HardHat,
  },
  {
    type: "employee",
    label: "Employee",
    role: "analytics-employee",
    Icon: UserRoundPlus,
  },
];

export const isAnalyticsType = (value: string): value is AnalyticsType =>
  ANALYTICS.some((entry) => entry.type === value);

export const getAnalytics = (type: AnalyticsType) =>
  ANALYTICS.find((entry) => entry.type === type)!;

export const canViewAnalyticsType = (roles: string[], type: AnalyticsType) =>
  roles.includes(getAnalytics(type).role);

export const getAllowedAnalytics = (roles: string[]) =>
  ANALYTICS.filter((entry) => roles.includes(entry.role));

export const canViewAnalytics = (roles: string[]) =>
  getAllowedAnalytics(roles).length > 0;

export const analyticsHref = (type: AnalyticsType) =>
  `${ANALYTICS_PAGE.href}/${type}`;

// The filters every dashboard takes: inclusive Africa/Nairobi submission
// dates (YYYY-MM-DD) and an optional department ("" = every department)
export type AnalyticsFilters = {
  from: string;
  to: string;
  department: string;
};

export const MAX_DEPARTMENT_LENGTH = 255;

export function getAnalyticsFiltersError({
  from,
  to,
  department,
}: AnalyticsFilters): string | null {
  if (department.length > MAX_DEPARTMENT_LENGTH) return "Unknown department";
  return getReportRangeError(from, to, "A dashboard");
}

// The default range: the last 12 months, from the 1st of the month 11
// months back to `today` (YYYY-MM-DD, Nairobi)
export function defaultAnalyticsRange(today: string) {
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 12, 1));
  return {
    from: start.toISOString().slice(0, 10),
    to: today,
  };
}

// Casual budgets run by financial year, April -> March, keyed by the
// calendar year its April falls in ("2026-2027"), as in
// lib/casualBudgetRules.ts
export const isFinancialYear = (value: string) => {
  const match = /^(\d{4})-(\d{4})$/.exec(value);
  return !!match && Number(match[2]) === Number(match[1]) + 1;
};

// The financial year `today` (YYYY-MM-DD, Nairobi) falls in
export function currentFinancialYear(today: string) {
  const [year, month] = today.split("-").map(Number);
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}
