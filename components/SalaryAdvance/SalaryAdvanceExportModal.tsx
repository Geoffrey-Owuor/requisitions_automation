"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/Modal";
import { DatePicker } from "@/components/DatePicker";

interface SalaryAdvanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportScope = "range" | "unexported";

export function SalaryAdvanceExportModal({
  isOpen,
  onClose,
}: SalaryAdvanceExportModalProps) {
  const [scope, setScope] = useState<ExportScope>("range");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const isRangeScope = scope === "range";
  const canExport = isRangeScope ? !!fromDate && !!toDate : true;

  const handleExport = async () => {
    if (!canExport) return;

    try {
      setIsExporting(true);

      const query = isRangeScope
        ? `fromDate=${fromDate}&toDate=${toDate}`
        : `scope=unexported`;
      const response = await fetch(`/api/salaryadvance/export-data?${query}`);

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Convert the response buffer to a Blob for downloading
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isRangeScope
        ? `Salary_Advances_${fromDate}_to_${toDate}.xlsx`
        : `Salary_Advances_Not_Yet_Exported.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close the modal after a successful download trigger
      onClose();
    } catch (error) {
      console.error("Salary Advance Data Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      icon={<FileSpreadsheet size={18} className="text-red-500" />}
      title="Export Data"
      subtitle="Download salary advances as Excel"
      widthClassName="sm:max-w-3xl"
      bodyClassName="flex flex-col gap-4 p-5 sm:p-6"
      overflowVisible
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="rounded-control flex items-center gap-2 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          Scope
        </label>
        <div className="rounded-control flex items-center gap-1 border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setScope("range")}
            className={`rounded-control flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              isRangeScope
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Date range
          </button>
          <button
            onClick={() => setScope("unexported")}
            className={`rounded-control flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              !isRangeScope
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Everything not yet exported
          </button>
        </div>
      </div>

      {isRangeScope ? (
        <div className="flex w-full items-center gap-2 max-sm:flex-col max-sm:items-stretch">
          <div className="flex w-full flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              From Date
            </label>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="Select start date"
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              To Date
            </label>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="Select end date"
            />
          </div>
        </div>
      ) : (
        <p className="rounded-control bg-gray-50 p-3 text-xs text-gray-600">
          Rows not yet exported, plus every continuous request — without
          touching the exported flags, so the scheduled report still picks these
          rows up normally.
        </p>
      )}
    </Modal>
  );
}
