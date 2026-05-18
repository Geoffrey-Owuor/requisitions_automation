import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";
import Footer from "../Footer";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      {/* Desktop sidebar handles lg screens */}
      <DashboardSidebar />

      {/* Mobile header handles screens below lg */}
      <MobileHeader />
      {/* <DashboardHeader /> */}
      <div className="fixed top-16 right-1 bottom-0 left-1 overflow-y-auto rounded-3xl border border-slate-100 bg-white [scrollbar-gutter:stable] sm:bottom-1 sm:rounded-2xl lg:top-1 lg:left-20">
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
