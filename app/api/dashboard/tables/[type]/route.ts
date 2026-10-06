import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  isDashboardRequisitionType,
  loadDashboardTable,
} from "@/lib/dashboardLoaders";

// Dashboard table reads go through this GET route rather than server
// actions: Next.js dispatches server actions one at a time per client, so a
// dashboard with a dozen tables loaded them strictly in sequence. Plain
// fetches run in parallel. Each loader still does its own role/membership
// check — the route only validates the type and flag.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { type } = await params;
  if (!isDashboardRequisitionType(type)) {
    return NextResponse.json({ message: "Unknown type" }, { status: 404 });
  }

  const search = request.nextUrl.searchParams;
  const result = loadDashboardTable(type, search.get("flag") ?? "", {
    // Clamped again by toSafeOffsetLimit inside each loader
    page: Number(search.get("page")) || 1,
    pageSize: Number(search.get("pageSize")) || 6,
    searchTerm: search.get("search") ?? "",
  });
  if (!result) {
    return NextResponse.json({ message: "Unknown flag" }, { status: 400 });
  }

  return NextResponse.json(await result, {
    headers: { "Cache-Control": "no-store" },
  });
}
