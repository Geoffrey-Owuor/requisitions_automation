import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";
import Footer from "../Footer";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed inset-0 min-h-screen bg-linear-to-br from-red-950 via-red-950 to-red-900">
      {/* Desktop sidebar handles lg screens */}
      <DashboardSidebar />

      {/* Mobile header handles screens below lg */}
      <MobileHeader />
      <div
        id="dashboard-wrapper"
        className="fixed top-16 right-1 bottom-0 left-1 overflow-y-auto rounded-3xl bg-white [scrollbar-gutter:stable] sm:bottom-1 sm:rounded-2xl lg:top-1 lg:left-20"
      >
        <div className="flex h-full flex-col">
          {/* Content */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
