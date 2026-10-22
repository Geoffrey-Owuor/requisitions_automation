import "server-only";
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import { loadEmployeeAnalytics } from "@/lib/analytics/queries/employee";
import { loadTravelAnalytics } from "@/lib/analytics/queries/travel";

// Dashboard type -> its data loader, for app/api/analytics/[type]
export const ANALYTICS_LOADERS: Record<
  AnalyticsType,
  (filters: AnalyticsFilters) => Promise<unknown>
> = {
  travel: loadTravelAnalytics,
  employee: loadEmployeeAnalytics,
};
