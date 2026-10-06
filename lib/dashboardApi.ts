// Client-side fetchers for the dashboard's read endpoints under
// app/api/dashboard/. Safe to import from client components — no server
// imports here.
import type { PaginatedResult } from "@/lib/pagination";
import type { QueryResultRow } from "pg";

export type DashboardRequisitionType =
  | "travel"
  | "it"
  | "access"
  | "casual"
  | "employee";

export async function fetchDashboardTable(
  type: DashboardRequisitionType,
  {
    dataFlag,
    page,
    pageSize,
    searchTerm,
  }: { dataFlag: string; page: number; pageSize: number; searchTerm: string },
): Promise<PaginatedResult<QueryResultRow>> {
  const params = new URLSearchParams({
    flag: dataFlag,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (searchTerm.trim()) params.set("search", searchTerm.trim());

  const response = await fetch(`/api/dashboard/tables/${type}?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${type} requisitions (${response.status})`);
  }
  return response.json();
}
