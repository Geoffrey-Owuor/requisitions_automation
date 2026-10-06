import {
  CircleDollarSign,
  FileChartColumn,
  HardHat,
  LockKeyhole,
  Monitor,
  type LucideIcon,
} from "lucide-react";

// The downloadable reports on the dashboard's Reports page. Shared by the
// page (what to offer), the nav (whether to show the link) and the download
// route (app/api/reports/[type]), which re-checks the role on every request.
// Each report has its own role — see migration 022_requisition_reports.sql —
// and owner roles such as `it` or `hr-advance` don't unlock one by themselves.

// The Reports page, as the sidebar, mobile drawer and app launcher link it
export const REPORTS_PAGE = {
  href: "/dashboard/reports",
  label: "Reports",
  Icon: FileChartColumn,
};

export type ReportType =
  | "it"
  | "access"
  | "casual"
  | "advance";

export type ReportDefinition = {
  type: ReportType;
  label: string;
  description: string;
  // What one spreadsheet row is, e.g. "One row per section"
  rowUnit: string;
  role: string;
  Icon: LucideIcon;
};

export const REPORTS: ReportDefinition[] = [
  {
    type: "it",
    label: "IT Requisitions",
    description:
      "Requested equipment, HOD and IT decisions, and fulfilment status.",
    rowUnit: "One row per requisition",
    role: "reports-it",
    Icon: Monitor,
  },
  {
    type: "access",
    label: "Key & Access Requisitions",
    description:
      "Requested keys and access codes, with the HOD and Security decisions.",
    rowUnit: "One row per requisition",
    role: "reports-access",
    Icon: LockKeyhole,
  },
  {
    type: "casual",
    label: "Casual Requisitions",
    description:
      "Engagement periods, rates and totals per section, approvals and amendment history.",
    rowUnit: "One row per section",
    role: "reports-casual",
    Icon: HardHat,
  },
  {
    type: "advance",
    label: "Salary Advances",
    description:
      "Advance requests and HR decisions, plus a second sheet of self-service alterations.",
    rowUnit: "One row per request",
    role: "reports-advance",
    Icon: CircleDollarSign,
  },
];

export const isReportType = (value: string): value is ReportType =>
  REPORTS.some((report) => report.type === value);

export const getReport = (type: ReportType) =>
  REPORTS.find((report) => report.type === type)!;

export const canDownloadReport = (roles: string[], type: ReportType) =>
  roles.includes(getReport(type).role);

export const getAllowedReports = (roles: string[]) =>
  REPORTS.filter((report) => roles.includes(report.role));

export const canViewReports = (roles: string[]) =>
  getAllowedReports(roles).length > 0;

// Every report buckets its own stage statuses into one of these (each
// report's "Overall Status" column is the detailed form).
export type ReportStatusFilter = "all" | "approved" | "declined" | "pending";

export const REPORT_STATUS_FILTERS: {
  value: ReportStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "pending", label: "Pending" },
];

export const isReportStatusFilter = (
  value: string,
): value is ReportStatusFilter =>
  REPORT_STATUS_FILTERS.some((filter) => filter.value === value);

export const MAX_REPORT_RANGE_MONTHS = 12;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Parses a YYYY-MM-DD calendar date, rejecting impossible ones (2026-02-30)
function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

/**
 * Why a from/to pair can't be used, or null when it can. Both dates are
 * inclusive Africa/Nairobi calendar days, and the range may span at most
 * MAX_REPORT_RANGE_MONTHS (1 Jan to 31 Dec is fine; 1 Jan to 1 Jan is not).
 */
export function getReportRangeError(from: string, to: string): string | null {
  if (!from || !to) return "Choose both a from date and a to date";

  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (!fromDate || !toDate) return "Dates must be valid YYYY-MM-DD dates";
  if (fromDate > toDate) return "The from date must be on or before the to date";

  const limit = new Date(fromDate);
  limit.setUTCMonth(limit.getUTCMonth() + MAX_REPORT_RANGE_MONTHS);
  if (toDate >= limit) {
    return `A report can cover at most ${MAX_REPORT_RANGE_MONTHS} months`;
  }
  return null;
}
