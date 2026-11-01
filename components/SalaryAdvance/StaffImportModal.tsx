"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { useAlertStore } from "@/store/useAlertStore";
import {
  STAFF_IMPORT_MAX_BYTES,
  STAFF_IMPORT_MAX_ROWS,
  STAFF_IMPORT_URL,
  type StaffImportCheck,
  type StaffImportResponse,
  type StaffImportRow,
} from "@/lib/staffImport";

// The Staff directory's Excel import: download the template, upload it for
// a per-row check, then import. Nothing is imported while any row fails
// (app/api/salaryadvance/staff-import re-checks on import).

const STATUS_ORDER: Record<StaffImportRow["status"], number> = {
  error: 0,
  new: 1,
  existing: 2,
};

export default function StaffImportModal({
  open,
  onClose,
  invalidateKeys,
}: {
  open: boolean;
  onClose: () => void;
  invalidateKeys: readonly (readonly string[])[];
}) {
  const queryClient = useQueryClient();
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<StaffImportCheck | null>(null);
  const [busy, setBusy] = useState<"checking" | "importing" | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Start blank each time the modal opens (it stays mounted while closed)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFile(null);
      setCheck(null);
    }
  }

  const send = async (chosen: File, mode: "check" | "import") => {
    const body = new FormData();
    body.append("file", chosen);
    body.append("mode", mode);
    const response = await fetch(STAFF_IMPORT_URL, { method: "POST", body });
    return (await response.json()) as StaffImportResponse;
  };

  const choose = async (chosen: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!chosen) return;
    setFile(chosen);
    setCheck(null);
    if (chosen.size > STAFF_IMPORT_MAX_BYTES) {
      triggerAlert("error", "The file is larger than 2MB");
      setFile(null);
      return;
    }
    setBusy("checking");
    try {
      const result = await send(chosen, "check");
      if ("mode" in result && result.mode === "check") setCheck(result.check);
      else {
        triggerAlert("error", result.message);
        setFile(null);
      }
    } catch {
      triggerAlert("error", "The file could not be checked, please try again");
      setFile(null);
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setBusy("importing");
    try {
      const result = await send(file, "import");
      if ("mode" in result && result.mode === "import") {
        triggerAlert("success", result.message);
        onClose();
        invalidateKeys.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
      } else if ("mode" in result && result.mode === "refused") {
        triggerAlert("error", result.message);
        setCheck(result.check);
      } else if (!("mode" in result)) {
        triggerAlert("error", result.message);
      }
    } catch {
      triggerAlert("error", "Nothing was imported, please try again");
    } finally {
      setBusy(null);
    }
  };

  const canImport =
    !!check &&
    check.fileErrors.length === 0 &&
    check.counts.error === 0 &&
    check.counts.new > 0 &&
    !busy;
  const rows = check
    ? [...check.rows].sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.rowNumber - b.rowNumber,
      )
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import staff from Excel"
      subtitle="Adds new records only - existing ones are never changed."
      icon={<FileSpreadsheet className="h-4 w-4" />}
      widthClassName="sm:max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canImport}
            onClick={runImport}
            className="rounded-control inline-flex items-center gap-2 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy === "importing" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {check && check.counts.new > 0
              ? `Import ${check.counts.new} staff`
              : "Import"}
          </button>
        </>
      }
    >
      <ol className="space-y-3 text-sm text-neutral-700">
        <li className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            <span className="font-semibold">1.</span> Fill in the template - one
            person per row, up to {STAFF_IMPORT_MAX_ROWS}.
          </span>
          <a
            href={STAFF_IMPORT_URL}
            download
            className="rounded-control inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:border-neutral-400"
          >
            <Download className="h-4 w-4" />
            Download template
          </a>
        </li>
        <li className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            <span className="font-semibold">2.</span> Upload it to check every
            row before anything is imported.
          </span>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-control inline-flex items-center gap-2 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {file ? "Choose another file" : "Choose file"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            tabIndex={-1}
            aria-label="Staff import file"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          {file && (
            <span className="min-w-0 truncate text-xs text-neutral-500">
              {file.name}
            </span>
          )}
        </li>
      </ol>

      {busy === "checking" && (
        <div className="rounded-surface h-32 animate-pulse bg-neutral-100" />
      )}

      {check && check.fileErrors.length > 0 && (
        <div className="rounded-control border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {check.fileErrors.map((error) => (
            <p key={error} className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}

      {check && check.fileErrors.length === 0 && (
        <>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              {check.counts.new} to add
            </span>
            {check.counts.existing > 0 && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">
                {check.counts.existing} already on file (skipped)
              </span>
            )}
            {check.counts.error > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                {check.counts.error} with problems
              </span>
            )}
          </div>

          {check.counts.error > 0 ? (
            <p className="rounded-control flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Fix the rows with problems in the file and upload it again.
              Nothing is imported until every row passes.
            </p>
          ) : check.counts.new === 0 ? (
            <p className="rounded-control flex items-start gap-2 border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Every row is already on file - there is nothing to import.
            </p>
          ) : (
            <p className="rounded-control flex items-start gap-2 border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Check the details below before importing. Other company apps use
              these records to confirm who someone is, and add the same people
              in the HR system too.
            </p>
          )}

          <div className="rounded-surface overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-neutral-500 uppercase">
                  <th className="px-3 py-2.5">Row</th>
                  <th className="px-3 py-2.5">Staff no.</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.status === "error" ? "bg-rose-50/40" : undefined
                    }
                  >
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                      {row.staffNumber || "-"}
                    </td>
                    <td className="px-3 py-2 text-neutral-900">
                      {row.name || "-"}
                    </td>
                    <td className="px-3 py-2 break-all text-neutral-700">
                      {row.email || "-"}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {row.department || "-"}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {row.location || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {row.status === "error" ? (
                        <ul className="space-y-0.5 text-rose-700">
                          {row.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      ) : row.status === "new" ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CircleCheck className="h-3.5 w-3.5" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          Already on file
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
