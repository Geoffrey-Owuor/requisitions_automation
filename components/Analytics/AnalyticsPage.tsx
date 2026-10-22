"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { Select } from "@/components/Select";
import {
  ANALYTICS,
  ANALYTICS_PAGE,
  analyticsHref,
  defaultAnalyticsRange,
  getAnalytics,
  getAnalyticsFiltersError,
  type AnalyticsFilters,
  type AnalyticsType,
} from "@/lib/analytics/definitions";
import EmployeeAnalytics from "./EmployeeAnalytics";

// YYYY-MM-DD arithmetic on Nairobi calendar dates, in UTC so the viewer's
// own time zone can't shift a day
const isoMonthStart = (today: string, monthsBack: number) => {
  const [year, month] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 - monthsBack, 1))
    .toISOString()
    .slice(0, 10);
};

type RangePreset = {
  label: string;
  range: (today: string) => { from: string; to: string };
};

const RANGE_PRESETS: RangePreset[] = [
  {
    label: "This month",
    range: (today) => ({ from: isoMonthStart(today, 0), to: today }),
  },
  {
    label: "Last 3 months",
    range: (today) => ({ from: isoMonthStart(today, 2), to: today }),
  },
  {
    label: "Year to date",
    range: (today) => ({ from: `${today.slice(0, 4)}-01-01`, to: today }),
  },
  { label: "Last 12 months", range: defaultAnalyticsRange },
];

const filtersQuery = ({ from, to, department }: AnalyticsFilters) => {
  const params = new URLSearchParams({ from, to });
  if (department) params.set("department", department);
  return params.toString();
};

const fieldLabel =
  "text-[11px] font-bold tracking-widest text-gray-400 uppercase";

export default function AnalyticsPage({
  type,
  allowedTypes,
  filters,
  departments,
  today,
}: {
  type: AnalyticsType;
  allowedTypes: AnalyticsType[];
  // Already validated by the page
  filters: AnalyticsFilters;
  departments: string[];
  // YYYY-MM-DD in Nairobi time
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { label, Icon } = getAnalytics(type);

  // The date fields can hold a range the URL can't take yet (from after
  // to); only a usable range replaces the URL, which drives the dashboard
  const [draft, setDraft] = useState(filters);
  // The URL changed some other way (back/forward, the switcher): show it
  const [shownQuery, setShownQuery] = useState(filtersQuery(filters));
  if (shownQuery !== filtersQuery(filters)) {
    setShownQuery(filtersQuery(filters));
    setDraft(filters);
  }
  const draftError = getAnalyticsFiltersError(draft);

  const applyFilters = (next: AnalyticsFilters) => {
    setDraft(next);
    if (!getAnalyticsFiltersError(next)) {
      router.replace(`${pathname}?${filtersQuery(next)}`, { scroll: false });
    }
  };

  const activePreset = RANGE_PRESETS.find((preset) => {
    const range = preset.range(today);
    return range.from === draft.from && range.to === draft.to;
  });

  return (
    <div className="space-y-4 px-2 pt-4 pb-6">
      {/* Dashboard switcher — keeps the filters */}
      {allowedTypes.length > 1 && (
        <nav
          aria-label="Analytics dashboards"
          className="flex flex-wrap items-center gap-1.5"
        >
          {ANALYTICS.filter((entry) => allowedTypes.includes(entry.type)).map(
            (entry) => {
              const isActive = entry.type === type;
              return (
                <Link
                  key={entry.type}
                  href={`${analyticsHref(entry.type)}?${filtersQuery(filters)}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-compact inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-neutral-300 bg-white/60 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
                >
                  <entry.Icon className="h-3.5 w-3.5" />
                  {entry.label}
                </Link>
              );
            },
          )}
        </nav>
      )}

      {/* Header */}
      <div>
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

      {/* Filters */}
      <section
        aria-label="Analytics filters"
        className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4"
      >
        <div className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const isActive = preset === activePreset;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  applyFilters({ ...draft, ...preset.range(today) })
                }
                className={`rounded-compact border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>Submitted from</label>
            <DatePicker
              tone="slate"
              value={draft.from}
              onChange={(from) => applyFilters({ ...draft, from })}
              placeholder="Select start date"
              maxDate={today}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>Submitted to (inclusive)</label>
            <DatePicker
              tone="slate"
              value={draft.to}
              onChange={(to) => applyFilters({ ...draft, to })}
              placeholder="Select end date"
              minDate={draft.from || undefined}
              maxDate={today}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Department</span>
            <Select
              tone="slate"
              value={draft.department}
              onChange={(department) => applyFilters({ ...draft, department })}
              options={[
                { value: "", label: "All departments" },
                ...departments.map((name) => ({ value: name, label: name })),
              ]}
              unlistedLabel={draft.department || undefined}
              aria-label="Department"
            />
          </div>
        </div>

        {draftError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {draftError}
          </p>
        ) : (
          <p className="flex items-start gap-2 text-xs text-gray-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Submission dates in Nairobi time, up to 12 months.
            &ldquo;Approved&rdquo; means fully approved at the final stage.
          </p>
        )}
      </section>

      {type === "employee" && <EmployeeAnalytics filters={filters} />}
    </div>
  );
}
