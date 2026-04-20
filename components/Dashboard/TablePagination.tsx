"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TablePaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (n: number) => void;
};

export const TablePagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex items-center justify-between px-2 py-6">
      <p className="text-[13px] font-medium text-[#a18080]">
        Showing{" "}
        <span className="text-rose-600">
          {(currentPage - 1) * itemsPerPage + 1}
        </span>{" "}
        to{" "}
        <span className="text-rose-600">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of {totalItems}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-xl border border-white/80 bg-white/70 p-2 text-rose-500 shadow-sm transition-all active:scale-95 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-white/80 bg-white/70 p-2 text-rose-500 shadow-sm transition-all active:scale-95 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
