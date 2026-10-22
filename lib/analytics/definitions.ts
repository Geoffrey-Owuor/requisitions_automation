import { ChartColumnBig, UserRoundPlus, type LucideIcon } from "lucide-react";
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

// Migration 035 also seeds analytics-travel, analytics-casual and
// analytics-it; their dashboards join this list as they're built.
export type AnalyticsType = "employee";

export type AnalyticsDefinition = {
  type: AnalyticsType;
  label: string;
  role: string;
  Icon: LucideIcon;
};

export const ANALYTICS: AnalyticsDefinition[] = [
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
