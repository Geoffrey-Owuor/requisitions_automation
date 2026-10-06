import { NextRequest, NextResponse } from "next/server";
import { QueryResultRow } from "pg";
import { getSession } from "@/lib/session";
import { PaginatedResult } from "@/lib/pagination";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import { getTravelRequisitionData } from "@/serverActions/GetTravelRequisitionData";
import { getITRequisitionData } from "@/serverActions/GetITRequisitionData";
import { getAccessRequisitionData } from "@/serverActions/GetAccessRequisitionData";
import { getCasualRequisitionData } from "@/serverActions/GetCasualRequisitionData";
import { getEmployeeRequisitionData } from "@/serverActions/GetEmployeeRequisitionData";

// Dashboard table reads go through this GET route rather than server
// actions: Next.js dispatches server actions one at a time per client, so a
// dashboard with a dozen tables loaded them strictly in sequence. Plain
// fetches run in parallel. Each loader still does its own role/membership
// check — the route only validates the type and flag.

type LoadArgs = { page: number; pageSize: number; searchTerm: string };
type Loader = (
  dataFlag: string,
  args: LoadArgs,
) => Promise<PaginatedResult<QueryResultRow>> | null;

// Binds a loader to the flags it accepts; unknown flags return null.
function loader<F extends string>(
  flags: readonly F[],
  load: (
    args: LoadArgs & { dataFlag: F },
  ) => Promise<PaginatedResult<QueryResultRow>>,
): Loader {
  return (dataFlag, args) =>
    (flags as readonly string[]).includes(dataFlag)
      ? load({ ...args, dataFlag: dataFlag as F })
      : null;
}

const LOADERS: Record<DashboardRequisitionType, Loader> = {
  travel: loader(
    ["userData", "hodPending", "hrPending", "directorPending", "history"],
    getTravelRequisitionData,
  ),
  it: loader(
    ["userData", "hodPending", "itPending", "itAll", "history"],
    getITRequisitionData,
  ),
  access: loader(
    ["userData", "hodPending", "securityPending", "history"],
    getAccessRequisitionData,
  ),
  casual: loader(
    ["userData", "hodPending", "hrPending", "history"],
    getCasualRequisitionData,
  ),
  employee: loader(
    [
      "userData",
      "hodPending",
      "retailDirectorPending",
      "directorPending",
      "hrPending",
      "history",
    ],
    getEmployeeRequisitionData,
  ),
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { type } = await params;
  if (!Object.hasOwn(LOADERS, type)) {
    return NextResponse.json({ message: "Unknown type" }, { status: 404 });
  }

  const search = request.nextUrl.searchParams;
  const result = LOADERS[type as DashboardRequisitionType](
    search.get("flag") ?? "",
    {
      // Clamped again by toSafeOffsetLimit inside each loader
      page: Number(search.get("page")) || 1,
      pageSize: Number(search.get("pageSize")) || 6,
      searchTerm: search.get("search") ?? "",
    },
  );
  if (!result) {
    return NextResponse.json({ message: "Unknown flag" }, { status: 400 });
  }

  return NextResponse.json(await result, {
    headers: { "Cache-Control": "no-store" },
  });
}
