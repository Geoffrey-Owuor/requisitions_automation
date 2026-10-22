// Client-side fetcher for app/api/analytics/[type]. Safe to import from
// client components — no server imports here.
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import type { EmployeeAnalytics } from "@/lib/analytics/types";

export type AnalyticsData = {
  employee: EmployeeAnalytics;
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
