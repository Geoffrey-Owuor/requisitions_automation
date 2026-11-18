import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  canViewAnalyticsType,
  getAnalyticsFiltersError,
  isAnalyticsType,
} from "@/lib/analytics/definitions";
import { parseRecordFilters } from "@/lib/analytics/records";
import { ANALYTICS_RECORD_LOADERS } from "@/lib/analytics/records/loaders";

// One page of a dashboard's Records view:
//   GET /api/analytics/{type}/records?from&to&department&page&pageSize&search
//       plus the dashboard's record filters (lib/analytics/records.ts)
// Unlike the figures route this returns requisition rows, so it re-checks
// the dashboard's role on every request, as that route does.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { type } = await params;
  const loader = isAnalyticsType(type)
    ? ANALYTICS_RECORD_LOADERS[type]
    : undefined;
  if (!isAnalyticsType(type) || !loader) {
    return NextResponse.json({ message: "Unknown dashboard" }, { status: 404 });
  }

  const roles = await getUserRoles(session.email);
  if (!canViewAnalyticsType(roles, type)) {
    return NextResponse.json(
      { message: "You are not authorized to view this dashboard" },
      { status: 403 },
    );
  }

  const search = request.nextUrl.searchParams;
  const filters = {
    from: search.get("from") ?? "",
    to: search.get("to") ?? "",
    department: search.get("department") ?? "",
  };
  const filtersError = getAnalyticsFiltersError(filters);
  if (filtersError) {
    return NextResponse.json({ message: filtersError }, { status: 400 });
  }

  try {
    const data = await loader({
      filters,
      recordFilters: parseRecordFilters(type, (key) => search.get(key)),
      // Clamped again by toSafeOffsetLimit
      page: Number(search.get("page")) || 1,
      pageSize: Number(search.get("pageSize")) || 10,
      searchTerm: (search.get("search") ?? "").slice(0, 200),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(`Error while loading the ${type} records:`, error);
    return NextResponse.json(
      { message: "Something went wrong while loading the records" },
      { status: 500 },
    );
  }
}
