"use client";

import SalaryAdvanceCards from "./SalaryAdvanceCards";
import SalaryAdvanceTable from "./SalaryAdvanceTable";
import EmailChangeRequestsPanel from "./EmailChangeRequestsPanel";
import StaffDirectoryPanel from "./StaffDirectoryPanel";

export type SalaryAdvanceView = "requests" | "email-changes" | "staff";

// The HR (hr-advance) side of salary advances. The views are switched from
// the sticky bar in DashboardAdvanceWrapper; only the active view mounts,
// so only it fetches.
export default function SalaryAdvanceDashboard({
  view,
}: {
  view: SalaryAdvanceView;
}) {
  return (
    <div className="px-2 pt-4 pb-6">
      {view === "requests" && (
        <>
          <SalaryAdvanceCards />
          <SalaryAdvanceTable />
        </>
      )}
      {view === "email-changes" && <EmailChangeRequestsPanel />}
      {view === "staff" && <StaffDirectoryPanel />}
    </div>
  );
}
