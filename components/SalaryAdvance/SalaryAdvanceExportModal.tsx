"use client";

import { useState } from "react";
import { X, Download, FileSpreadsheet } from "lucide-react";
import ClientPortal from "@/components/ClientPortal";
import { DatePicker } from "@/components/DatePicker";

interface SalaryAdvanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalaryAdvanceExportModal({
  isOpen,
  onClose,
}: SalaryAdvanceExportModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!fromDate || !toDate) return;

    try {
      setIsExporting(true);

      const response = await fetch(
        `/api/salaryadvance/export-data?fromDate=${fromDate}&toDate=${toDate}`,
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Convert the response buffer to a Blob for downloading
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Salary_Advances_${fromDate}_to_${toDate}.xlsx`;
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

  return (
    <ClientPortal>
      <div
        onClick={onClose}
        className="client-scrollbar fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-6"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Export Data
                </h2>
                <p className="text-xs text-gray-600">
                  Download salary advances as Excel
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}

          <div className="flex w-full items-center gap-2 p-6">
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!fromDate || !toDate || isExporting}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Download size={16} />
              )}
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
