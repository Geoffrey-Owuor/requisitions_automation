import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  canViewAnalyticsType,
  getAnalyticsFiltersError,
  isAnalyticsType,
} from "@/lib/analytics/definitions";
import { ANALYTICS_LOADERS } from "@/lib/analytics/loaders";

// One analytics dashboard's figures:
//   GET /api/analytics/{type}?from=YYYY-MM-DD&to=YYYY-MM-DD&department=
// Dates are inclusive Africa/Nairobi calendar days on the submission date;
// an empty department means every department. The Analytics pages only
// offer what the viewer may see; this route re-checks the dashboard's role
// on every request.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { type } = await params;
  if (!isAnalyticsType(type)) {
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
    const data = await ANALYTICS_LOADERS[type](filters);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(`Error while loading the ${type} analytics:`, error);
    return NextResponse.json(
      { message: "Something went wrong while loading the dashboard" },
      { status: 500 },
    );
  }
}
