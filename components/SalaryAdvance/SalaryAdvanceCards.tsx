"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Repeat,
  FileDigit,
  BarChart3,
  Activity,
  Layers,
  BadgeCent,
  RotateCcw,
} from "lucide-react";
import {
  GetSalaryAdvanceCounts,
  SalaryAdvanceCounts,
} from "@/serverActions/GetSalaryAdvanceCounts";

const DefaultCardCounts: SalaryAdvanceCounts = {
  total: 0,
  pending: 0,
  approved: 0,
  declined: 0,
  oneoff: 0,
  continuous: 0,
};

const maxCount = (count: number) => {
  return count > 500 ? "500+" : count;
};

export default function SalaryAdvanceCards() {
  const {
    data: counts = DefaultCardCounts,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["SalaryAdvancesCounts"],
    queryFn: () => GetSalaryAdvanceCounts(),
  });

  if (isPending) {
    return (
      <div className="mb-6">
        <div className="mb-4 h-6 w-64 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-42 animate-pulse rounded-2xl bg-neutral-100 shadow-[0_8px_16px_rgba(60,100,160,0.02)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-medium text-neutral-700">
          <BadgeCent className="h-5 w-5" />
          Salary Advances Overview
        </span>

        {/* Refetch button */}
        <button
          onClick={() => refetch()}
          title="refetch card counts"
          className="rounded-full bg-neutral-200/70 p-2 hover:bg-neutral-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Overview Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_16px_rgba(60,100,160,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <BarChart3 size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Total Requests
              </h3>
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                Lifetime
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight text-slate-800">
              {maxCount(counts.total)}
            </span>
            <span className="mb-1 text-sm text-gray-500">Submissions</span>
          </div>
          <Banknote className="absolute -right-4 -bottom-4 h-24 w-24 text-neutral-200 opacity-50" />
        </div>

        {/* 2. Status Breakdown Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_16px_rgba(60,100,160,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Status Breakdown
              </h3>
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                Workflow State
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 rounded-xl border border-amber-100/50 bg-amber-50/50 p-2">
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock size={12} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide">Pending</span>
              </div>
              <span className="text-lg font-bold text-amber-700">
                {maxCount(counts.pending)}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-emerald-100/50 bg-emerald-50/50 p-2">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide">
                  Approved
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-700">
                {maxCount(counts.approved)}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-red-100/50 bg-red-50/50 p-2">
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle size={12} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide">
                  Declined
                </span>
              </div>
              <span className="text-lg font-bold text-red-700">
                {maxCount(counts.declined)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Request Types Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_16px_rgba(60,100,160,0.04)] sm:col-span-2 lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Layers size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Request Types
              </h3>
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                Category
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FileDigit size={14} strokeWidth={2} />
                <span className="text-xs font-bold tracking-wide text-gray-600">
                  One-Off
                </span>
              </div>
              <span className="text-xl font-bold text-gray-800">
                {maxCount(counts.oneoff)}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Repeat size={14} strokeWidth={2} />
                <span className="text-xs font-bold tracking-wide text-gray-600">
                  Continuous
                </span>
              </div>
              <span className="text-xl font-bold text-gray-800">
                {maxCount(counts.continuous)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
