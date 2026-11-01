import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";
import { UnsavedChangesProvider } from "./UnsavedChangesGuard";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    // The guard wraps the navs too, so their links and Back button ask
    // before leaving a requisition form with unsaved input
    <UnsavedChangesProvider>
      <div className="min-h-screen bg-red-950">
        {/* Mobile header handles screens below lg */}
        <MobileHeader />

        {/* Desktop sidebar handles lg screens */}
        <DashboardSidebar />

        {/* The scroller's own radius rounds the page area, and the matching
            scrollbar-inset keeps the flush thumb off the rounded corners.
            Only the top corners are rounded below the custom breakpoint,
            where the page area runs to the bottom of the screen. */}
        <div
          id="dashboard-wrapper"
          className="layout-scrollbar app-scrollbars custom:top-dashboard-gap custom:right-dashboard-gap custom:bottom-dashboard-gap custom:left-dashboard-sidebar rounded-t-dashboard scrollbar-inset-t-dashboard custom:rounded-dashboard custom:scrollbar-inset-dashboard fixed top-16 right-0 bottom-0 left-0 bg-white"
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </div>
      </div>
    </UnsavedChangesProvider>
  );
};

export default DashboardWrapper;
