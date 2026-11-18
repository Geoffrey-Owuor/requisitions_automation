// Client-side fetcher for app/api/analytics/[type]. Safe to import from
// client components — no server imports here.
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import type {
  AdvanceAnalytics,
  CasualAnalytics,
  CasualBudget,
  EmployeeAnalytics,
  ItAnalytics,
  TravelAnalytics,
} from "@/lib/analytics/types";
import type { RecordFilters } from "@/lib/analytics/records";
import type { PaginatedResult } from "@/lib/pagination";
import type { QueryResultRow } from "pg";

export type AnalyticsData = {
  travel: TravelAnalytics;
  casual: CasualAnalytics;
  employee: EmployeeAnalytics;
  it: ItAnalytics;
  advance: AdvanceAnalytics;
};

export const analyticsQueryKey = (
  type: AnalyticsType,
  filters: AnalyticsFilters,
) => ["Analytics", type, filters.from, filters.to, filters.department];

export async function fetchAnalytics<T extends AnalyticsType>(
  type: T,
  { from, to, department }: AnalyticsFilters,
): Promise<AnalyticsData[T]> {
  const params = new URLSearchParams({ from, to, department });
  const response = await fetch(`/api/analytics/${type}?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to load the ${type} analytics (${response.status})`,
    );
  }
  return response.json();
}

export const casualBudgetQueryKey = (
  financialYear: string,
  department: string,
) => ["Analytics", "casual-budget", financialYear, department];

export async function fetchCasualBudget(
  financialYear: string,
  department: string,
): Promise<CasualBudget> {
  const params = new URLSearchParams({ fy: financialYear, department });
  const response = await fetch(`/api/analytics/casual/budget?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load the casual budget (${response.status})`);
  }
  return response.json();
}

export const analyticsRecordsQueryKey = (type: AnalyticsType) => [
  "Analytics",
  type,
  "records",
];

// One page of a dashboard's Records view
export async function fetchAnalyticsRecords(
  type: AnalyticsType,
  {
    filters: { from, to, department },
    recordFilters,
    page,
    pageSize,
    searchTerm,
  }: {
    filters: AnalyticsFilters;
    recordFilters: RecordFilters;
    page: number;
    pageSize: number;
    searchTerm: string;
  },
): Promise<PaginatedResult<QueryResultRow>> {
  const params = new URLSearchParams({
    from,
    to,
    department,
    page: String(page),
    pageSize: String(pageSize),
    ...recordFilters,
  });
  if (searchTerm.trim()) params.set("search", searchTerm.trim());
  const response = await fetch(`/api/analytics/${type}/records?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load the ${type} records (${response.status})`);
  }
  return response.json();
}
