import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { getApproverMemberships } from "@/serverActions/GetApproverMemberships";
import { getVisibleTables } from "@/lib/dashboardTables";
import { loadDashboardTable } from "@/lib/dashboardLoaders";
import type { DashboardSummary } from "@/lib/dashboardApi";

// Row counts for the home page and the type pages' tab badges: the
// viewer's own submissions and every pending queue they can see, in one
// request. Counts come from the same loaders as the tables (a one-row page's
// totalCount), so they can't drift from what the tables show. History isn't
// counted — it only grows, so a number there tells nobody anything.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const [roles, memberships] = await Promise.all([
    getUserRoles(session.email),
    getApproverMemberships(),
  ]);
  const entries = getVisibleTables({ roles, memberships }).filter(
    (entry) => entry.tab !== "history",
  );

  const results = await Promise.all(
    entries.map((entry) =>
      loadDashboardTable(entry.type, entry.dataFlag, {
        page: 1,
        pageSize: 1,
        searchTerm: "",
      }),
    ),
  );

  const summary: DashboardSummary = {
    counts: Object.fromEntries(
      entries.map((entry, i) => [entry.key, results[i]?.totalCount ?? 0]),
    ),
  };
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
