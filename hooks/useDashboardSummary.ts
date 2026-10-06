"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/dashboardApi";

// Invalidate this key alongside a requisition type's table key whenever a
// submission or amendment changes what the counts would show.
export const DASHBOARD_SUMMARY_KEY = ["DashboardSummary"];

// Always refetched on mount: it's one cheap request, and the counts are
// what tells an approver something new is waiting after acting elsewhere
// (approval pages are separate routes).
export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: fetchDashboardSummary,
    staleTime: 0,
  });
}
