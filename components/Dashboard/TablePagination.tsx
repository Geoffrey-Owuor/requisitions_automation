"use client";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type TablePaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (n: number) => void;
  onItemsPerPageChange: (n: number) => void;
  rowsPerPageOptions?: number[];
};

export const TablePagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  rowsPerPageOptions = [6, 10, 20, 50, 100],
}: TablePaginationProps) => {
  const [isRowsMenuOpen, setIsRowsMenuOpen] = useState(false);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-6">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-[13px] font-medium text-slate-600">
          Showing{" "}
          <span className="text-slate-950">
            {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="text-slate-950">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="text-slate-950">{totalItems}</span>
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRowsMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white/60 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-white"
          >
            {itemsPerPage} / page
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                isRowsMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isRowsMenuOpen && (
            <>
              {/* Invisible overlay to handle clicking outside to close */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRowsMenuOpen(false)}
              />
              {/* Dropdown Menu — opens upward since pagination sits at the bottom of the table */}
              <div className="absolute bottom-[calc(100%+4px)] left-0 z-50 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {rowsPerPageOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      onItemsPerPageChange(option);
                      setIsRowsMenuOpen(false);
                    }}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] whitespace-nowrap transition-all duration-200 ${
                      itemsPerPage === option
                        ? "bg-rose-50 font-medium text-rose-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {option} rows
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full bg-slate-900 p-2 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-full bg-slate-900 p-2 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
