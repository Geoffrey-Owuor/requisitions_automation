import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  MAX_DEPARTMENT_LENGTH,
  canViewAnalyticsType,
  isFinancialYear,
} from "@/lib/analytics/definitions";
import { loadCasualBudget } from "@/lib/analytics/queries/casual";

// The Casual dashboard's budget section, for one financial year:
//   GET /api/analytics/casual/budget?fy=2026-2027&department=
// Budgets run by financial year rather than the dashboard's submission
// dates, so this is its own request. Same role as the Casual dashboard.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const roles = await getUserRoles(session.email);
  if (!canViewAnalyticsType(roles, "casual")) {
    return NextResponse.json(
      { message: "You are not authorized to view this dashboard" },
      { status: 403 },
    );
  }

  const search = request.nextUrl.searchParams;
  const financialYear = search.get("fy") ?? "";
  const department = search.get("department") ?? "";
  if (!isFinancialYear(financialYear)) {
    return NextResponse.json(
      { message: "Choose a financial year such as 2026-2027" },
      { status: 400 },
    );
  }
  if (department.length > MAX_DEPARTMENT_LENGTH) {
    return NextResponse.json(
      { message: "Unknown department" },
      { status: 400 },
    );
  }

  try {
    const data = await loadCasualBudget(financialYear, department);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error while loading the casual budget analytics:", error);
    return NextResponse.json(
      { message: "Something went wrong while loading the budget" },
      { status: 500 },
    );
  }
}
