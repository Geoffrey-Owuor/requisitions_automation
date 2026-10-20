"use client";

import { ReactNode, useId, useState } from "react";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/store/useAlertStore";
import { History, Plus, Search, X } from "lucide-react";
import { AlertDialog, useLastDefined } from "@/components/Modal";
import { TablePagination } from "@/components/Dashboard/TablePagination";
import type { ConfigActionResult } from "@/lib/configAdminAccess";

// Building blocks shared by the Settings tabs

// YYYY-MM-DD plus one day, in UTC so no local time zone shifts the date
export const nextDay = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);

// Runs a Settings action, reports its outcome as a toast and reloads the
// tab's data (`adminKey`) plus any form caches of the same data
// (`relatedKeys`). `run` resolves to whether it succeeded, so forms can
// clear their inputs.
export function useSettingsRunner(adminKey: QueryKey, relatedKeys: QueryKey[]) {
  const queryClient = useQueryClient();
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<ConfigActionResult>) => {
    setBusy(true);
    try {
      const result = await action();
      triggerAlert(result.ok ? "success" : "error", result.message);
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: adminKey });
        relatedKeys.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
      }
      return result.ok;
    } catch {
      triggerAlert("error", "The change could not be saved, please try again");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, run };
}

export const inputClass =
  "h-10 w-full rounded-control border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-slate-900";
export const primaryButtonClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-control bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
export const smallButtonClass =
  "rounded-compact border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400 disabled:opacity-50";

// A small visible label over a form control. With `htmlFor` it is a real
// <label>; without (e.g. over the DatePicker, which takes no id) it only
// captions the control.
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const Caption = htmlFor ? "label" : "span";
  return (
    <div className="min-w-0 space-y-1">
      <Caption
        htmlFor={htmlFor}
        className="block text-xs font-medium text-neutral-600"
      >
        {label}
      </Caption>
      {children}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
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
          onClick={() => onChange("")}
          className="rounded-compact absolute top-1/2 right-2 -translate-y-1/2 p-1 text-neutral-500 hover:bg-neutral-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const LIST_PAGE_SIZES = [10, 25, 50];

// Pages a Settings list in the browser, since each tab loads its data
// whole. The page is clamped rather than reset when the list shrinks, so
// removing the last row of the last page shows the page before it.
export function useListPage<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LIST_PAGE_SIZES[0]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  return {
    pageItems: items.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
    // For filters and searches, which start again from the first page
    resetPage: () => setPage(1),
    pagination: {
      currentPage,
      totalItems: items.length,
      itemsPerPage: pageSize,
      onPageChange: setPage,
      onItemsPerPageChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}

// The pager under a `useListPage` list, hidden while it fits on one
// page of the smallest size
export function ListPagination({
  pagination,
}: {
  pagination: ReturnType<typeof useListPage>["pagination"];
}) {
  if (pagination.totalItems <= LIST_PAGE_SIZES[0]) return null;
  return (
    <TablePagination {...pagination} rowsPerPageOptions={LIST_PAGE_SIZES} />
  );
}

export type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  // An optional free-text field (e.g. a reason), passed to `action`
  input?: { label: string; maxLength: number };
  action: (input: string) => Promise<ConfigActionResult>;
};

export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-surface space-y-4 border border-neutral-200 bg-white p-4">
      <div>
        <h2 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          {title}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "grey";
  children: ReactNode;
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    grey: "bg-neutral-100 text-neutral-500",
  }[tone];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function ToggleList({
  items,
  busy,
  label,
  confirm,
  setActive,
  run,
}: {
  items: { id: number; name: string; isActive: boolean; detail?: string }[];
  busy: boolean;
  label: string;
  confirm: (confirmation: Confirmation) => void;
  setActive: (id: number, isActive: boolean) => Promise<ConfigActionResult>;
  run: (action: () => Promise<ConfigActionResult>) => Promise<boolean>;
}) {
  const { pageItems, pagination } = useListPage(items);

  return (
    <div>
      <ul className="divide-y divide-neutral-100">
        {pageItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <p
                className={`truncate text-sm ${item.isActive ? "text-neutral-900" : "text-neutral-400 line-through"}`}
              >
                {item.name}
              </p>
              {item.detail && (
                <p className="text-xs text-neutral-500">{item.detail}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!item.isActive && (
                <StatusBadge tone="grey">Inactive</StatusBadge>
              )}
              <button
                type="button"
                disabled={busy}
                className={smallButtonClass}
                onClick={() =>
                  item.isActive
                    ? confirm({
                        title: `Deactivate "${item.name}"?`,
                        message: `It won't be offered on new requisitions. Requisitions that already use this ${label} keep it, and you can reactivate it later.`,
                        confirmLabel: "Deactivate",
                        action: () => setActive(item.id, false),
                      })
                    : run(() => setActive(item.id, true))
                }
              >
                {item.isActive ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ListPagination pagination={pagination} />
    </div>
  );
}

export function AddRow({
  placeholder,
  value,
  onChange,
  busy,
  onAdd,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onAdd: () => void;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onAdd();
      }}
    >
      <input
        aria-label={placeholder}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        maxLength={100}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className={primaryButtonClass}
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </form>
  );
}

export function ConfirmDialog({
  confirmation,
  busy,
  onClose,
  onConfirm,
}: {
  confirmation: Confirmation | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (action: () => Promise<ConfigActionResult>) => void;
}) {
  const titleId = useId();
  const messageId = useId();
  const inputId = useId();
  // Keep the last content while the dialog animates closed
  const shown = useLastDefined(confirmation);
  // Each new confirmation starts with an empty input
  const [input, setInput] = useState("");
  const [inputFor, setInputFor] = useState(confirmation);
  if (confirmation !== inputFor) {
    setInputFor(confirmation);
    if (confirmation) setInput("");
  }

  return (
    <AlertDialog
      open={!!confirmation}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={messageId}
    >
      <h2 id={titleId} className="text-base font-semibold text-neutral-900">
        {shown?.title}
      </h2>
      <p id={messageId} className="mt-2 text-sm text-neutral-600">
        {shown?.message}
      </p>
      {shown?.input && (
        <div className="mt-4">
          <Field label={shown.input.label} htmlFor={inputId}>
            <textarea
              id={inputId}
              rows={3}
              maxLength={shown.input.maxLength}
              className={`${inputClass} h-auto resize-none py-2`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </Field>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-control border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => shown && onConfirm(() => shown.action(input))}
          className="rounded-control bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {shown?.confirmLabel}
        </button>
      </div>
    </AlertDialog>
  );
}

// A config_changes row as the Settings tabs list it
export type ConfigChange = {
  id: string;
  summary: string;
  changedByName: string;
  changedAt: string;
};

export function ChangesCard({ changes }: { changes: ConfigChange[] }) {
  return (
    <Card
      title="Recent changes"
      description="The last 30 changes made on this page."
    >
      {changes.length === 0 ? (
        <p className="text-sm text-neutral-500">No changes yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {changes.map((change) => (
            <li key={change.id} className="flex items-start gap-2 py-2 text-sm">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <div className="min-w-0">
                <p className="text-neutral-900">{change.summary}</p>
                <p className="text-xs text-neutral-500">
                  {change.changedByName} · {change.changedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// A tab whose data failed to load, with a retry
export function LoadError({
  what,
  onRetry,
}: {
  what: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-surface border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      The {what} could not be loaded.{" "}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold underline"
      >
        Try again
      </button>
    </div>
  );
}
