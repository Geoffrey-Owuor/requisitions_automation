import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";

// The Records view of the analytics dashboards: every requisition behind
// the charts, in a paged table whose rows open the read-only details modal.
// It shares the page's date range and department, and adds filters of its
// own per dashboard, all kept in the URL. Served by
// app/api/analytics/[type]/records under the dashboard's own role.
// Client-safe; the SQL each option stands for lives server-side in
// lib/analytics/records/, keyed by the same filter keys and values.

export type AnalyticsView = "charts" | "records";

export type RecordFilterSpec = {
  // URL parameter; must not clash with from, to, department or view
  key: string;
  label: string;
  // Shown when the filter is off ("" in the URL)
  allLabel: string;
  options: { value: string; label: string }[];
};

// Dashboards without an entry have no Records view yet
export const ANALYTICS_RECORD_FILTERS: Partial<
  Record<AnalyticsType, RecordFilterSpec[]>
> = {
  it: [
    {
      key: "status",
      label: "Status",
      allLabel: "Any status",
      options: [
        { value: "accepted", label: "Accepted by IT" },
        { value: "awaiting-hod", label: "Awaiting HOD" },
        { value: "awaiting-it", label: "Awaiting IT" },
        { value: "declined-hod", label: "Declined by HOD" },
        { value: "rejected-it", label: "Rejected by IT" },
      ],
    },
    {
      key: "kind",
      label: "New or replacement",
      allLabel: "New and replacement",
      options: [
        { value: "new", label: "New" },
        { value: "replacement", label: "Replacement" },
      ],
    },
    {
      key: "completion",
      label: "Completion",
      allLabel: "Any completion",
      options: [
        { value: "completed", label: "Completed" },
        { value: "awaiting", label: "Accepted, awaiting completion" },
      ],
    },
  ],
};

export const hasAnalyticsRecords = (type: AnalyticsType) =>
  !!ANALYTICS_RECORD_FILTERS[type];

// Filter key -> chosen value; a filter that's off is left out
export type RecordFilters = Record<string, string>;

// The dashboard's record filters from the URL, keeping only known values
export function parseRecordFilters(
  type: AnalyticsType,
  get: (key: string) => string | null | undefined,
): RecordFilters {
  const filters: RecordFilters = {};
  for (const spec of ANALYTICS_RECORD_FILTERS[type] ?? []) {
    const value = get(spec.key);
    if (value && spec.options.some((option) => option.value === value)) {
      filters[spec.key] = value;
    }
  }
  return filters;
}

// The page's whole query string: the shared filters, then the view and
// the record filters when the Records view is open
export function analyticsPageQuery(
  { from, to, department }: AnalyticsFilters,
  view: AnalyticsView = "charts",
  recordFilters: RecordFilters = {},
) {
  const params = new URLSearchParams({ from, to });
  if (department) params.set("department", department);
  if (view === "records") {
    params.set("view", "records");
    for (const [key, value] of Object.entries(recordFilters)) {
      if (value) params.set(key, value);
    }
  }
  return params.toString();
}
