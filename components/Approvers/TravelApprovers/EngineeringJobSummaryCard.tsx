"use client";
import { useMemo } from "react";
import { Wrench } from "lucide-react";

interface EngineeringJobSummaryCardProps {
  jobDetailsString: string | null | undefined;
}

export default function EngineeringJobSummaryCard({
  jobDetailsString,
}: EngineeringJobSummaryCardProps) {
  // Parse the string and calculate the total in one pass
  const { parsedJobs, totalAmount } = useMemo(() => {
    if (!jobDetailsString) return { parsedJobs: [], totalAmount: 0 };

    // 1. Split by newline to get each job entry
    const lines = jobDetailsString
      .split("\n")
      .filter((line) => line.trim() !== "");

    let total = 0;

    // 2. Map lines into objects and keep a running total
    const jobs = lines.map((line, index) => {
      // Split by the exact string we used during submission
      const [title, amountString] = line.split(" - ");
      const amount = Number(amountString) || 0;

      total += amount;

      return {
        id: `job-${index}`,
        title: title?.trim() || "Unknown Job",
        amount,
      };
    });

    return { parsedJobs: jobs, totalAmount: total };
  }, [jobDetailsString]);

  // If there are no jobs (e.g., not an engineering requisition), don't render the card at all
  if (parsedJobs.length === 0) return null;

  return (
    <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-xs">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Wrench size={14} />
        </div>
        <h3 className="text-[11px] font-semibold tracking-[0.4px] text-rose-800 uppercase">
          Engineering Job Allocations
        </h3>
      </div>

      {/* Parsed Jobs List */}
      <div className="flex flex-col gap-3">
        {parsedJobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between border-b border-rose-100/60 pb-2.5 text-[13px] last:border-0 last:pb-0"
          >
            <span className="font-medium text-[#7c5a5a]">{job.title}</span>
            <span className="font-semibold text-[#1e1b1b]">
              KES {job.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Calculated Total Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-rose-200/80 pt-3">
        <span className="text-[13px] font-semibold tracking-wide text-rose-700">
          Allocations Total
        </span>
        <span className="text-[16px] font-bold tracking-tight text-rose-900">
          KES {totalAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
