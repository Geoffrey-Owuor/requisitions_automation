"use client";

import { Select } from "@/components/Select";
import type {
  AnalyticsFilters,
  AnalyticsType,
} from "@/lib/analytics/definitions";
import {
  ANALYTICS_RECORD_FILTERS,
  type RecordFilters,
} from "@/lib/analytics/records";
import ItRecordsTable from "./records/ItRecordsTable";

export type RecordsTableProps = {
  filters: AnalyticsFilters;
  recordFilters: RecordFilters;
};

const fieldLabel =
  "text-[11px] font-bold tracking-widest text-gray-400 uppercase";

// The Records view: the dashboard's own filters, then its table. The
// page's date range and department apply too.
export default function AnalyticsRecords({
  type,
  filters,
  recordFilters,
  onRecordFiltersChange,
}: {
  type: AnalyticsType;
  filters: AnalyticsFilters;
  recordFilters: RecordFilters;
  onRecordFiltersChange: (next: RecordFilters) => void;
}) {
  const specs = ANALYTICS_RECORD_FILTERS[type] ?? [];
  const activeCount = Object.keys(recordFilters).length;

  const setFilter = (key: string, value: string) => {
    const next = { ...recordFilters };
    if (value) next[key] = value;
    else delete next[key];
    onRecordFiltersChange(next);
  };

  return (
    <div className="space-y-4">
      <section
        aria-label="Record filters"
        className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <div key={spec.key} className="flex flex-col gap-1.5">
              <span className={fieldLabel}>{spec.label}</span>
              <Select
                tone="slate"
                value={recordFilters[spec.key] ?? ""}
                onChange={(value) => setFilter(spec.key, value)}
                options={[{ value: "", label: spec.allLabel }, ...spec.options]}
                aria-label={spec.label}
              />
            </div>
          ))}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onRecordFiltersChange({})}
            className="text-xs font-semibold text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Clear {activeCount === 1 ? "filter" : `${activeCount} filters`}
          </button>
        )}
      </section>

      {type === "it" && (
        <ItRecordsTable filters={filters} recordFilters={recordFilters} />
      )}
    </div>
  );
}
