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

// The Status filter of a type whose stages run in `stages` order:
// approved, then awaiting each stage, then declined at each stage. Keep in
// step with statusFilterSql in lib/analytics/records/shared.ts.
const recordStatusFilter = (
  stages: { key: string; label: string }[],
  approvedLabel = "Fully approved",
): RecordFilterSpec => ({
  key: "status",
  label: "Status",
  allLabel: "Any status",
  options: [
    { value: "approved", label: approvedLabel },
    ...stages.map(({ key, label }) => ({
      value: `awaiting-${key}`,
      label: `Awaiting ${label}`,
    })),
    ...stages.map(({ key, label }) => ({
      value: `declined-${key}`,
      label: `Declined by ${label}`,
    })),
  ],
});

const amendedFilter: RecordFilterSpec = {
  key: "amended",
  label: "Amendments",
  allLabel: "Amended or not",
  options: [
    { value: "yes", label: "Amended" },
    { value: "no", label: "Never amended" },
  ],
};

// Dashboards without an entry have no Records view yet
export const ANALYTICS_RECORD_FILTERS: Partial<
  Record<AnalyticsType, RecordFilterSpec[]>
> = {
  travel: [
    recordStatusFilter([
      { key: "hod", label: "HOD" },
      { key: "hr", label: "HR" },
      { key: "director", label: "Director" },
    ]),
    {
      key: "tier",
      label: "Approval tier",
      allLabel: "Any tier",
      options: [
        { value: "1", label: "Tier 1" },
        { value: "2", label: "Tier 2" },
        { value: "3", label: "Tier 3" },
      ],
    },
    amendedFilter,
    {
      key: "pushback",
      label: "HR push-backs",
      allLabel: "Pushed back or not",
      options: [
        { value: "yes", label: "HR decision pushed back" },
        { value: "no", label: "Never pushed back" },
      ],
    },
  ],
  casual: [
    recordStatusFilter(
      [
        { key: "hod", label: "HOD" },
        { key: "hr", label: "HR" },
      ],
      "Approved by HR",
    ),
    amendedFilter,
  ],
  employee: [
    recordStatusFilter([
      { key: "hod", label: "HOD" },
      { key: "retail_director", label: "Retail Director" },
      { key: "hr", label: "HR" },
      { key: "director", label: "CEO" },
    ]),
    {
      key: "kind",
      label: "Positions",
      allLabel: "New and replacement",
      options: [
        { value: "new", label: "Has a new position" },
        { value: "replacement", label: "Has a replacement" },
      ],
    },
    amendedFilter,
    {
      key: "source",
      label: "Source",
      allLabel: "Submitted or imported",
      options: [
        { value: "app", label: "Submitted in the Hub" },
        { value: "imported", label: "Imported from Excel" },
      ],
    },
  ],
  advance: [
    recordStatusFilter([{ key: "hr", label: "HR" }], "Approved by HR"),
    {
      key: "type",
      label: "Repayment",
      allLabel: "One-off and continuous",
      options: [
        { value: "oneoff", label: "One-off" },
        { value: "continuous", label: "Continuous" },
      ],
    },
    {
      key: "exported",
      label: "Export",
      allLabel: "Exported or not",
      options: [
        { value: "yes", label: "In an HR/Finance export" },
        { value: "no", label: "Not exported yet" },
      ],
    },
    {
      key: "altered",
      label: "Alterations",
      allLabel: "Altered or not",
      options: [
        { value: "yes", label: "Altered after export" },
        { value: "no", label: "Never altered" },
      ],
    },
  ],
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
