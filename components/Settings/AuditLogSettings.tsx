"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, History, Search, X } from "lucide-react";
import {
  type ConfigChangeEntry,
  getConfigChangeLog,
  getConfigChangeTables,
  getReportDownloadLog,
} from "@/serverActions/AuditLogAdmin";
import { useServerPagination } from "@/hooks/useServerPagination";
import { Select } from "@/components/Select";
import { TablePagination } from "@/components/Dashboard/TablePagination";
import { AuditLogSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import { Card, inputClass, LoadError, StatusBadge } from "./SettingsPrimitives";

type Source = "changes" | "downloads";

const ACTION_BADGE = {
  create: { tone: "green", label: "Added" },
  update: { tone: "amber", label: "Changed" },
  delete: { tone: "grey", label: "Removed" },
} as const;

// "casual_department_budgets" -> "Casual department budgets"
const tableLabel = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");

export default function AuditLogSettings() {
  const [source, setSource] = useState<Source>("changes");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Audit log"
        className="rounded-control flex w-fit gap-1 border border-neutral-200 bg-white p-1"
      >
        {(
          [
            { key: "changes", label: "Settings changes", Icon: History },
            { key: "downloads", label: "Report downloads", Icon: Download },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={source === key}
            onClick={() => setSource(key)}
            className={`rounded-compact inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
              source === key
                ? "bg-slate-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {source === "changes" ? <ChangeLog /> : <DownloadLog />}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  onClear,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-48 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        aria-label={placeholder}
        className={`${inputClass} pr-9 pl-9`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="rounded-compact absolute top-1/2 right-2 -translate-y-1/2 p-1 text-neutral-500 hover:bg-neutral-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ChangeLog() {
  const [tableName, setTableName] = useState("");
  const { data: tables } = useQuery({
    queryKey: ["ConfigChangeTables"],
    queryFn: getConfigChangeTables,
  });

  const log = useServerPagination({
    queryKey: ["ConfigChangeLog"],
    params: { tableName },
    initialPageSize: 20,
    queryFn: ({ page, pageSize, searchTerm, params }) =>
      getConfigChangeLog({ page, pageSize, searchTerm, ...params }),
  });

  return (
    <Card
      title="Settings changes"
      description="Every change made on this page and in the salary advance staff directory, newest first. Edits made directly in the database aren't recorded."
    >
      <div className="flex flex-wrap gap-2">
        <SearchBox
          value={log.searchTerm}
          onChange={log.setSearchTerm}
          onClear={log.clearSearch}
          placeholder="Search changes or people"
        />
        <div className="w-full sm:w-64">
          <Select
            aria-label="Filter by table"
            value={tableName}
            onChange={(value) => {
              setTableName(value);
              log.setCurrentPage(1);
            }}
            options={[
              { value: "", label: "Everything" },
              ...(tables ?? []).map((name) => ({
                value: name,
                label: tableLabel(name),
              })),
            ]}
          />
        </div>
      </div>

      {log.isLoading ? (
        <AuditLogSkeleton />
      ) : log.isError ? (
        <LoadError what="changes" onRetry={() => log.refetch()} />
      ) : log.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          {log.isSearchActive || tableName
            ? "No changes match."
            : "No changes yet."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {log.data.map((entry) => (
            <ChangeRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {log.totalCount > 0 && (
        <TablePagination
          currentPage={log.currentPage}
          totalItems={log.totalCount}
          itemsPerPage={log.itemsPerPage}
          onPageChange={log.setCurrentPage}
          onItemsPerPageChange={log.setItemsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      )}
    </Card>
  );
}

function ChangeRow({ entry }: { entry: ConfigChangeEntry }) {
  const badge = ACTION_BADGE[entry.action];
  const hasDetail = entry.beforeData !== null || entry.afterData !== null;

  return (
    <li className="py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-900">{entry.summary}</p>
          <p className="text-xs text-neutral-500">
            {entry.changedByName} ({entry.changedByEmail}) · {entry.changedAt} ·{" "}
            {tableLabel(entry.tableName)}
          </p>
        </div>
        <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
      </div>
      {hasDetail && (
        <details className="group mt-1.5">
          <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
            Details
          </summary>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {(
              [
                ["Before", entry.beforeData],
                ["After", entry.afterData],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="text-[11px] font-semibold text-neutral-500">
                  {label}
                </p>
                <pre className="rounded-control mt-1 max-h-60 overflow-auto bg-neutral-50 p-2 text-[11px] text-neutral-700">
                  {value === null ? "-" : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </details>
      )}
    </li>
  );
}

function DownloadLog() {
  const log = useServerPagination({
    queryKey: ["ReportDownloadLog"],
    params: {},
    initialPageSize: 20,
    queryFn: ({ page, pageSize, searchTerm }) =>
      getReportDownloadLog({ page, pageSize, searchTerm }),
  });

  return (
    <Card
      title="Report downloads"
      description="Every Excel report downloaded from the Reports page, newest first."
    >
      <div className="flex">
        <SearchBox
          value={log.searchTerm}
          onChange={log.setSearchTerm}
          onClear={log.clearSearch}
          placeholder="Search report or person"
        />
      </div>

      {log.isLoading ? (
        <AuditLogSkeleton />
      ) : log.isError ? (
        <LoadError what="report downloads" onRetry={() => log.refetch()} />
      ) : log.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          {log.isSearchActive ? "No downloads match." : "No downloads yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                <th className="py-2 pr-3">Report</th>
                <th className="py-2 pr-3">Range</th>
                <th className="py-2 pr-3">Status filter</th>
                <th className="py-2 pr-3">Rows</th>
                <th className="py-2 pr-3">By</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {log.data.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2 pr-3 text-neutral-900 capitalize">
                    {entry.reportType}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-neutral-700">
                    {entry.fromDate} - {entry.toDate}
                  </td>
                  <td className="py-2 pr-3 text-neutral-700 capitalize">
                    {entry.statusFilter}
                  </td>
                  <td className="py-2 pr-3 text-neutral-700">
                    {entry.rowCount.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-neutral-700">
                    {entry.downloadedByName}
                  </td>
                  <td className="py-2 whitespace-nowrap text-neutral-500">
                    {entry.downloadedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {log.totalCount > 0 && (
        <TablePagination
          currentPage={log.currentPage}
          totalItems={log.totalCount}
          itemsPerPage={log.itemsPerPage}
          onPageChange={log.setCurrentPage}
          onItemsPerPageChange={log.setItemsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      )}
    </Card>
  );
}
