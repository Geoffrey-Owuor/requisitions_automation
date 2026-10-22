import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { loadAllDepartmentNames } from "@/lib/departments";
import {
  ANALYTICS_PAGE,
  defaultAnalyticsRange,
  getAllowedAnalytics,
  getAnalytics,
  getAnalyticsFiltersError,
  isAnalyticsType,
} from "@/lib/analytics/definitions";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import AnalyticsPage from "@/components/Analytics/AnalyticsPage";

type Params = Promise<{ type: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { type } = await params;
  return {
    title: isAnalyticsType(type)
      ? `${getAnalytics(type).label} Analytics`
      : ANALYTICS_PAGE.label,
    description: "Requisition analytics",
  };
}

const single = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

// Only for holders of the dashboard's role; the nav hides the Analytics
// link from everyone without one, and the data route re-checks the role.
// The filters live in the URL, so a filtered view can be shared.
const page = async ({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const session = await getSession();
  if (!session) redirect("/login");

  const { type } = await params;
  const allowed = getAllowedAnalytics(await getUserRoles(session.email));
  if (allowed.length === 0) redirect("/dashboard");
  if (!isAnalyticsType(type) || !allowed.some((entry) => entry.type === type)) {
    redirect(ANALYTICS_PAGE.href);
  }

  // Today as a Nairobi calendar date ("en-CA" formats as YYYY-MM-DD).
  // Computed here so server and client render agree.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  // Unusable filters in the URL fall back to the last 12 months, everywhere
  const query = await searchParams;
  const requested = {
    from: single(query.from),
    to: single(query.to),
    department: single(query.department),
  };
  const filters = getAnalyticsFiltersError(requested)
    ? { ...defaultAnalyticsRange(today), department: "" }
    : requested;

  const departments = await loadAllDepartmentNames();

  return (
    <RequisitionPagesWrapper>
      <AnalyticsPage
        type={type}
        allowedTypes={allowed.map((entry) => entry.type)}
        filters={filters}
        departments={departments}
        today={today}
      />
    </RequisitionPagesWrapper>
  );
};

export default page;
