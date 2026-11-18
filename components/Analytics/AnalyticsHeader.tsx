import Link from "next/link";
import { ChartColumnBig, Table2 } from "lucide-react";
import {
  ANALYTICS,
  analyticsHref,
  getAnalytics,
  type AnalyticsFilters,
  type AnalyticsType,
} from "@/lib/analytics/definitions";
import {
  ScrollingNav,
  StickyNavBar,
} from "@/components/Dashboard/StickyNavBar";
import {
  analyticsPageQuery,
  hasAnalyticsRecords,
  type AnalyticsView,
  type RecordFilters,
} from "@/lib/analytics/records";

const VIEWS: { view: AnalyticsView; label: string; Icon: typeof Table2 }[] = [
  { view: "charts", label: "Charts", Icon: ChartColumnBig },
  { view: "records", label: "Records", Icon: Table2 },
];

// The page title, then a sticky bar: a dashboard switcher (keeping the
// filters and view) for viewers who can see more than one dashboard, and
// the Charts | Records switch for dashboards with records. Rendered as
// RequisitionPagesWrapper's header so the bar spans the full page width.
export default function AnalyticsHeader({
  type,
  allowedTypes,
  filters,
  view,
  recordFilters,
}: {
  type: AnalyticsType;
  allowedTypes: AnalyticsType[];
  filters: AnalyticsFilters;
  view: AnalyticsView;
  recordFilters: RecordFilters;
}) {
  const showSwitcher = allowedTypes.length > 1;
  const showViews = hasAnalyticsRecords(type);

  const { heading, noun, Icon } = getAnalytics(type);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-2 pt-4 pb-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <Icon className="h-5 w-5 text-neutral-500" />
          {heading}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {filters.department
            ? `Figures for ${filters.department}, for ${noun} submitted in the chosen range.`
            : `Company-wide figures for ${noun} submitted in the chosen range.`}
        </p>
      </div>

      {(showSwitcher || showViews) && (
        <StickyNavBar>
          {showSwitcher ? (
            <ScrollingNav
              label="Analytics dashboards"
              activeKey={type}
              className="gap-1"
            >
              {ANALYTICS.filter((entry) =>
                allowedTypes.includes(entry.type),
              ).map((entry) => {
                const isActive = entry.type === type;
                return (
                  <Link
                    key={entry.type}
                    // Record filters belong to one dashboard, so they stay
                    href={`${analyticsHref(entry.type)}?${analyticsPageQuery(
                      filters,
                      hasAnalyticsRecords(entry.type) ? view : "charts",
                    )}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-compact inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <entry.Icon className="h-3.5 w-3.5" />
                    {entry.label}
                  </Link>
                );
              })}
            </ScrollingNav>
          ) : (
            <div className="flex-1" />
          )}

          {showViews && (
            <nav
              aria-label="Dashboard view"
              className="rounded-control flex shrink-0 gap-0.5 border border-neutral-200 bg-neutral-50 p-0.5"
            >
              {VIEWS.map((entry) => {
                const isActive = entry.view === view;
                return (
                  <Link
                    key={entry.view}
                    href={`?${analyticsPageQuery(filters, entry.view, recordFilters)}`}
                    scroll={false}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-compact inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <entry.Icon className="h-3.5 w-3.5" />
                    {entry.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </StickyNavBar>
      )}
    </>
  );
}
