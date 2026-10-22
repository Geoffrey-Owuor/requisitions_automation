// Client-side fetcher for app/api/analytics/[type]. Safe to import from
// client components — no server imports here.
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import type {
  CasualAnalytics,
  CasualBudget,
  EmployeeAnalytics,
  ItAnalytics,
  TravelAnalytics,
} from "@/lib/analytics/types";

export type AnalyticsData = {
  travel: TravelAnalytics;
  casual: CasualAnalytics;
  employee: EmployeeAnalytics;
  it: ItAnalytics;
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
