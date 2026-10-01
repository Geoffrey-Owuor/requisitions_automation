import DashboardSidebar from "../DashboardSidebar";
import MobileHeader from "../MobileHeader";
import DashboardModals from "./DashboardModals";

// The page area is square; these overlays paint the frame color around a
// 16px quarter-circle at each corner, so it still reads as rounded whatever
// the page content's background is. They sit outside the scroller so they
// don't scroll away. Bottom corners only show where the page area is inset.
const CORNER_OVERLAYS = [
  "top-16 left-0 custom:top-2 custom:left-20 bg-[radial-gradient(circle_at_100%_100%,transparent_15.5px,var(--color-red-950)_16px)]",
  "top-16 right-0 custom:top-2 custom:right-2 bg-[radial-gradient(circle_at_0_100%,transparent_15.5px,var(--color-red-950)_16px)]",
  "hidden custom:block bottom-2 left-20 bg-[radial-gradient(circle_at_100%_0,transparent_15.5px,var(--color-red-950)_16px)]",
  "hidden custom:block bottom-2 right-2 bg-[radial-gradient(circle_at_0_0,transparent_15.5px,var(--color-red-950)_16px)]",
];

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-red-950">
      {/* Mobile header handles screens below lg */}
      <MobileHeader />

      {/* Desktop sidebar handles lg screens */}
      <DashboardSidebar />

      {/* Requisition form modals, shared by both navs */}
      <DashboardModals />
      <div
        id="dashboard-wrapper"
        className="layout-scrollbar custom:bottom-2 custom:right-2 custom:top-2 custom:left-20 fixed top-16 right-0 bottom-0 left-0 bg-white"
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </div>
      {CORNER_OVERLAYS.map((corner) => (
        <div
          key={corner}
          aria-hidden="true"
          className={`pointer-events-none fixed size-4 ${corner}`}
        />
      ))}
    </div>
  );
};

export default DashboardWrapper;
