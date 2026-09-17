"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, Info } from "lucide-react";
import {
  getCasualBudgetEstimate,
  CasualBudgetSectionInput,
} from "@/serverActions/GetCasualBudgetEstimate";

// Shared between the submission confirmation step and the approver modal so
// both show the same budget-vs-spend breakdown for a casual requisition's
// sections (see .claude/skills/CHANGES.md).

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const UNIT_LABELS: Record<string, string> = {
  warehouse: "Warehouse",
  bond: "Bond",
};

function formatKES(amount: number) {
  return `KES ${Math.round(amount).toLocaleString()}`;
}

interface CasualBudgetEstimateProps {
  department: string;
  sections: CasualBudgetSectionInput[];
}

export default function CasualBudgetEstimate({
  department,
  sections,
}: CasualBudgetEstimateProps) {
  const validSections = sections.filter(
    (section) =>
      section.sectionName && section.numberOfCasuals > 0 && section.periodFrom,
  );

  const { data: estimates = [], isFetching } = useQuery({
    queryKey: ["CasualBudgetEstimate", department, validSections],
    queryFn: () =>
      getCasualBudgetEstimate({ department, sections: validSections }),
    enabled: !!department && validSections.length > 0,
  });

  if (!department || validSections.length === 0) return null;
  if (!isFetching && estimates.length === 0) return null;

  return (
    <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-5">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
        <Wallet className="h-3.5 w-3.5 text-rose-400" />
        Budget Impact
      </p>

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="text-[11.5px] leading-relaxed">
          These are projected figures, not actual recorded spend - only
          fully-approved requisitions are counted, and post-approval changes
          (e.g. sickness, absences, or emergencies affecting headcount)
          aren&apos;t reflected here. Finance&apos;s records remain the source
          of truth for actual spend.
        </p>
      </div>

      {isFetching && estimates.length === 0 && (
        <p className="text-[13px] text-[#7c5a5a]">Loading budget estimate…</p>
      )}

      <div className="flex flex-col gap-4">
        {estimates.map((estimate) => {
          const unitLabel = UNIT_LABELS[estimate.unit] ?? department;
          const touchedMonths = estimate.monthly.filter(
            (month) => month.pendingAddition > 0,
          );

          return (
            <div
              key={`${estimate.unit}-${estimate.financialYear}`}
              className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#1e1b1b]">
                  {unitLabel}
                </h3>
                <span className="text-[11px] text-[#a18080]">
                  FY {estimate.financialYear}
                </span>
              </div>

              <div className="mb-3 flex flex-col gap-2">
                {touchedMonths.map((month) => {
                  const overBudget = month.projectedSpend > month.budgetAmount;
                  return (
                    <div
                      key={month.calendarMonth}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-[13px]"
                    >
                      <span className="text-[#7c5a5a]">
                        {MONTH_NAMES[month.calendarMonth - 1]} budget
                      </span>
                      <span
                        className={`font-medium ${
                          overBudget ? "text-rose-600" : "text-[#1e1b1b]"
                        }`}
                      >
                        {formatKES(month.projectedSpend)} /{" "}
                        {formatKES(month.budgetAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-linear-to-r from-slate-800 to-rose-900 px-4 py-3 text-white">
                <span className="flex items-center gap-1.5 text-[12px] text-white/70">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Yearly projected / budget
                </span>
                <span className="text-[14px] font-semibold">
                  {formatKES(estimate.yearly.projectedSpend)} /{" "}
                  {formatKES(estimate.yearly.budgetAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
