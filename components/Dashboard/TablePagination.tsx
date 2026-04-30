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
      <p className="text-[13px] font-medium text-slate-600">
        Showing{" "}
        <span className="text-slate-950">
          {(currentPage - 1) * itemsPerPage + 1}
        </span>{" "}
        to{" "}
        <span className="text-slate-950">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="text-slate-950">{totalItems}</span>
      </p>
      {/* {totalItems > 6 && ( */}
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
      {/*  )} */}
    </div>
  );
};
