import Link from "next/link";
import {
  ANALYTICS,
  ANALYTICS_PAGE,
  analyticsFiltersQuery,
  analyticsHref,
  getAnalytics,
  type AnalyticsFilters,
  type AnalyticsType,
} from "@/lib/analytics/definitions";
import {
  ScrollingNav,
  StickyNavBar,
} from "@/components/Dashboard/StickyNavBar";

// The page title, then a sticky dashboard switcher (keeping the filters)
// for viewers who can see more than one dashboard. Rendered as
// RequisitionPagesWrapper's header so the bar spans the full page width.
export default function AnalyticsHeader({
  type,
  allowedTypes,
  filters,
}: {
  type: AnalyticsType;
  allowedTypes: AnalyticsType[];
  filters: AnalyticsFilters;
}) {
  const { label, Icon } = getAnalytics(type);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-2 pt-4 pb-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <Icon className="h-5 w-5 text-neutral-500" />
          {label} Requisition {ANALYTICS_PAGE.label}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {filters.department
            ? `Figures for ${filters.department}, for requisitions submitted in the chosen range.`
            : "Company-wide figures for requisitions submitted in the chosen range."}
        </p>
      </div>

      {allowedTypes.length > 1 && (
        <StickyNavBar>
          <ScrollingNav
            label="Analytics dashboards"
            activeKey={type}
            className="gap-1"
          >
            {ANALYTICS.filter((entry) => allowedTypes.includes(entry.type)).map(
              (entry) => {
                const isActive = entry.type === type;
                return (
                  <Link
                    key={entry.type}
                    href={`${analyticsHref(entry.type)}?${analyticsFiltersQuery(filters)}`}
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
              },
            )}
          </ScrollingNav>
        </StickyNavBar>
      )}
    </>
  );
}
