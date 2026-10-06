"use client";

import { useState } from "react";
import { Check, Download, Info } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import {
  REPORTS,
  REPORTS_PAGE,
  REPORT_STATUS_FILTERS,
  getReportRangeError,
  type ReportStatusFilter,
  type ReportType,
} from "@/lib/reports/definitions";

// Local calendar date as YYYY-MM-DD (the DatePicker's value format)
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

type RangePreset = { label: string; range: () => [Date, Date] };

const RANGE_PRESETS: RangePreset[] = [
  {
    label: "This month",
    range: () => {
      const today = new Date();
      return [new Date(today.getFullYear(), today.getMonth(), 1), today];
    },
  },
  {
    label: "Last month",
    range: () => {
      const today = new Date();
      return [
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        new Date(today.getFullYear(), today.getMonth(), 0),
      ];
    },
  },
  {
    label: "Last 3 months",
    range: () => {
      const today = new Date();
      return [new Date(today.getFullYear(), today.getMonth() - 2, 1), today];
    },
  },
  {
    label: "Year to date",
    range: () => {
      const today = new Date();
      return [new Date(today.getFullYear(), 0, 1), today];
    },
  },
];

// "attachment; filename="X.xlsx"" -> X.xlsx
const filenameFrom = (disposition: string | null) =>
  disposition?.match(/filename="([^"]+)"/)?.[1] ?? "report.xlsx";

export default function ReportsPage({
  reportTypes,
  today,
}: {
  reportTypes: ReportType[];
  // YYYY-MM-DD in Nairobi time; the default range is this month so far
  today: string;
}) {
  const reports = REPORTS.filter((report) => reportTypes.includes(report.type));

  const [selectedType, setSelectedType] = useState<ReportType>(reports[0].type);
  const [fromDate, setFromDate] = useState(`${today.slice(0, 8)}01`);
  const [toDate, setToDate] = useState(today);
  const [status, setStatus] = useState<ReportStatusFilter>("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const rangeError = getReportRangeError(fromDate, toDate);
  const selected = reports.find((report) => report.type === selectedType)!;

  const applyPreset = ({ range }: RangePreset) => {
    const [from, to] = range();
    setFromDate(toIsoDate(from));
    setToDate(toIsoDate(to));
  };

  const handleDownload = async () => {
    if (rangeError) return;
    setDownloadError("");
    setIsDownloading(true);

    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        status,
      });
      const response = await fetch(`/api/reports/${selectedType}?${params}`);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "The report could not be downloaded");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(response.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "The report could not be downloaded",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-5 px-2 pt-4 pb-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <REPORTS_PAGE.Icon className="h-5 w-5 text-neutral-500" />
          Reports
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Download requisition data as an Excel workbook for a range of
          submission dates.
        </p>
      </div>

      {/* Report picker */}
      <section aria-labelledby="report-picker" className="space-y-2">
        <h2
          id="report-picker"
          className="text-[11px] font-bold tracking-widest text-gray-400 uppercase"
        >
          Report
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="report-picker"
          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
        >
          {reports.map(({ type, label, description, rowUnit, Icon }) => {
            const isSelected = type === selectedType;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedType(type)}
                className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {description}
                  </span>
                  <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    {rowUnit}
                  </span>
                </span>
                {isSelected && (
                  <Check className="absolute top-3 right-3 h-4 w-4 text-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section
        aria-label="Report filters"
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Submitted from
            </label>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="Select start date"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Submitted to (inclusive)
            </label>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="Select end date"
              minDate={fromDate || undefined}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            Status
          </span>
          <div
            role="radiogroup"
            aria-label="Status"
            className="flex w-full flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 sm:w-fit"
          >
            {REPORT_STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={status === value}
                onClick={() => setStatus(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                  status === value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          Dates are submission dates in Nairobi time, up to 12 months per
          report. Every download is logged.
        </p>

        {(rangeError || downloadError) && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {rangeError ?? downloadError}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!!rangeError || isDownloading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download size={16} />
            )}
            {isDownloading ? "Preparing…" : `Download ${selected.label}`}
          </button>
        </div>
      </section>
    </div>
  );
}
