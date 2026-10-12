import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";
import { UnsavedChangesProvider } from "./UnsavedChangesGuard";

// The page area is square; these overlays paint the frame color around a
// quarter-circle of radius --radius-dashboard at each corner, so it still
// reads as rounded whatever the page content's background is. They sit
// outside the scroller so they don't scroll away. Bottom corners only show
// where the page area is inset.
const CORNER_OVERLAYS = [
  "top-16 left-0 custom:top-dashboard-gap custom:left-dashboard-sidebar bg-[radial-gradient(circle_at_100%_100%,transparent_calc(var(--radius-dashboard)_-_0.5px),var(--color-red-950)_var(--radius-dashboard))]",
  "top-16 right-0 custom:top-dashboard-gap custom:right-dashboard-gap bg-[radial-gradient(circle_at_0_100%,transparent_calc(var(--radius-dashboard)_-_0.5px),var(--color-red-950)_var(--radius-dashboard))]",
  "hidden custom:block bottom-dashboard-gap left-dashboard-sidebar bg-[radial-gradient(circle_at_100%_0,transparent_calc(var(--radius-dashboard)_-_0.5px),var(--color-red-950)_var(--radius-dashboard))]",
  "hidden custom:block bottom-dashboard-gap right-dashboard-gap bg-[radial-gradient(circle_at_0_0,transparent_calc(var(--radius-dashboard)_-_0.5px),var(--color-red-950)_var(--radius-dashboard))]",
];

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

        <div
          id="dashboard-wrapper"
          className="layout-scrollbar custom:top-dashboard-gap custom:right-dashboard-gap custom:bottom-dashboard-gap custom:left-dashboard-sidebar fixed top-16 right-0 bottom-0 left-0 bg-white"
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </div>
        {CORNER_OVERLAYS.map((corner) => (
          <div
            key={corner}
            aria-hidden="true"
            className={`pointer-events-none fixed size-(--radius-dashboard) ${corner}`}
          />
        ))}
      </div>
    </UnsavedChangesProvider>
  );
};

export default DashboardWrapper;
