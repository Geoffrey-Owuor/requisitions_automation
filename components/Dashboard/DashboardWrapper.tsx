import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-red-950 via-red-950 to-red-900">
      {/* Mobile header handles screens below lg */}
      <MobileHeader />

      {/* Desktop sidebar handles lg screens */}
      <DashboardSidebar />
      <div
        id="dashboard-wrapper"
        className="layout-scrollbar fixed top-16 right-0 bottom-0 left-0 rounded-t-2xl bg-white sm:rounded-tr-none lg:top-0 lg:left-20"
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
