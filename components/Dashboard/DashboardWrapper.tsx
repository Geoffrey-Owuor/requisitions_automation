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
        className="layout-scrollbar fixed top-16 right-1 bottom-0 left-1 rounded-2xl bg-white sm:bottom-1 sm:rounded-xl lg:top-1 lg:left-20"
      >
        <div className="flex h-full flex-col">
          {/* Content */}
          <main className="mx-auto w-full max-w-7xl flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
