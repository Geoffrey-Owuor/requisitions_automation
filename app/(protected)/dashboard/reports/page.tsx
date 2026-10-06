import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { getAllowedReports } from "@/lib/reports/definitions";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import ReportsPage from "@/components/Reports/ReportsPage";

export const metadata: Metadata = {
  title: "Reports",
  description: "Download requisition and salary advance reports",
};

// Only for holders of at least one report role; the nav hides the link from
// everyone else, and the download route re-checks each report's role.
const page = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const roles = await getUserRoles(session.email);
  const reportTypes = getAllowedReports(roles).map((report) => report.type);
  if (reportTypes.length === 0) redirect("/dashboard");

  // Default range: this month so far, as a Nairobi calendar date ("en-CA"
  // formats as YYYY-MM-DD). Computed here so server and client render agree.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  return (
    <RequisitionPagesWrapper>
      <ReportsPage reportTypes={reportTypes} today={today} />
    </RequisitionPagesWrapper>
  );
};

export default page;
