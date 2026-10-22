"use client";

import { ReactNode, useState } from "react";
import { ChartColumnBig, Table2, type LucideIcon } from "lucide-react";

// Shared pieces of the analytics dashboards: stat tiles, chart cards with a
// table view, and a bar list for short category breakdowns.

// Series colors, one per entity across every dashboard (validated with the
// dataviz palette checker against white: aqua is under 3:1, so every chart
// card offers a table view and bar lists print their values; declined and
// pending are close for deuteranopes, so never put them in one chart)
export const SERIES = {
  approved: "#2a78d6",
  requested: "#eb6834",
  pending: "#1baf7a",
  declined: "#e34948",
} as const;

// Chart chrome
export const CHART_INK = {
  axis: "#898781",
  grid: "#e1e0d9",
  baseline: "#c3c2b7",
  cursor: "rgba(11, 11, 11, 0.04)",
} as const;

const integer = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-KE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCount = (value: number) => integer.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatKes = (value: number) => `KES ${compact.format(value)}`;
export const formatKesExact = (value: number) => `KES ${integer.format(value)}`;

// "2026-03" -> "Mar 26"
export const formatMonth = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
};

export const percent = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";

export function StatTile({
  label,
  value,
  detail,
  Icon,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-surface flex flex-col gap-2 border border-neutral-200 bg-white p-4">
      <span className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        <span className="rounded-compact flex h-6 w-6 items-center justify-center bg-neutral-100 text-neutral-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </span>
      <span className="text-2xl font-semibold text-neutral-900">{value}</span>
      {detail && <span className="text-xs text-neutral-500">{detail}</span>}
    </div>
  );
}

export type TableView = {
  columns: string[];
  rows: (string | number)[][];
};

// A titled card around one chart, with a toggle to the same data as a table
export function ChartCard({
  title,
  subtitle,
  table,
  legend,
  isEmpty = false,
  emptyText = "Nothing to show for these filters",
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  table: TableView;
  legend?: { label: string; color: string }[];
  isEmpty?: boolean;
  emptyText?: string;
  className?: string;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section
      aria-label={title}
      className={`rounded-surface flex flex-col gap-3 border border-neutral-200 bg-white p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => setShowTable((value) => !value)}
            aria-pressed={showTable}
            className="rounded-compact inline-flex shrink-0 items-center gap-1.5 border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
          >
            {showTable ? (
              <ChartColumnBig className="h-3.5 w-3.5" />
            ) : (
              <Table2 className="h-3.5 w-3.5" />
            )}
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>

      {legend && !isEmpty && !showTable && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
          {legend.map(({ label, color }) => (
            <li key={label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="rounded-compact h-2.5 w-2.5"
                style={{ backgroundColor: color }}
              />
              {label}
            </li>
          ))}
        </ul>
      )}

      {isEmpty ? (
        <p className="rounded-control flex flex-1 items-center justify-center bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          {emptyText}
        </p>
      ) : showTable ? (
        <DataTable table={table} />
      ) : (
        children
      )}
    </section>
  );
}

function DataTable({ table }: { table: TableView }) {
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-neutral-200 text-xs text-neutral-500">
            {table.columns.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={`py-2 pr-3 font-medium ${index > 0 ? "text-right" : ""}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`py-2 pr-3 text-neutral-700 ${
                    index > 0 ? "text-right tabular-nums" : ""
                  }`}
                >
                  {typeof cell === "number" ? formatCount(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Horizontal bars for a handful of categories, each labelled with its value
export function BarList({
  items,
  color,
  formatValue = formatCount,
}: {
  items: { label: string; value: number; detail?: string }[];
  color: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-3">
      {items.map(({ label, value, detail }) => (
        <li key={label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-neutral-700">{label}</span>
            <span className="shrink-0 font-semibold text-neutral-900 tabular-nums">
              {formatValue(value)}
              {detail && (
                <span className="ml-1 font-normal text-neutral-500">
                  {detail}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(value / max) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Recharts tooltip body: a title and one row per series
export function ChartTooltip({
  active,
  label,
  payload,
  formatLabel = (value) => String(value),
  formatValue = formatCount,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number; color?: string }[];
  formatLabel?: (label: string | number) => string;
  formatValue?: (value: number) => string;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="rounded-control border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-neutral-900">
        {formatLabel(label)}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="flex items-center justify-between gap-4 text-neutral-600"
        >
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="rounded-compact h-2 w-2"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-neutral-900 tabular-nums">
            {formatValue(entry.value ?? 0)}
          </span>
        </p>
      ))}
    </div>
  );
}
