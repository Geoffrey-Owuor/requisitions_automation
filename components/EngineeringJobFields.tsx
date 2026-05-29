"use client";

import { Plus, Trash2, Wallet } from "lucide-react";

export interface EngineeringJob {
  id: string;
  title: string;
  amount: number;
}

interface EngineeringJobFieldsProps {
  jobs: EngineeringJob[];
  totalAmount: number;
  onChange: (jobs: EngineeringJob[]) => void;
}

export function EngineeringJobFields({
  jobs,
  totalAmount,
  onChange,
}: EngineeringJobFieldsProps) {
  const handleAdd = () => {
    // Generate a simple unique ID for the new row
    const newId = Math.random().toString(36).substring(2, 9);
    onChange([...jobs, { id: newId, title: "", amount: 0 }]);
  };

  const handleRemove = (id: string) => {
    if (jobs.length <= 1) return; // Ensure at least one field remains
    onChange(jobs.filter((job) => job.id !== id));
  };

  const handleChange = (
    id: string,
    field: keyof EngineeringJob,
    value: string | number,
  ) => {
    onChange(
      jobs.map((job) => (job.id === id ? { ...job, [field]: value } : job)),
    );
  };

  return (
    <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-rose-800">
            Engineering Job Allocations
          </h3>
          <p className="mt-1 text-xs text-[#7c5a5a]">
            At least one job title/ID and its respective expense amount must be
            provided.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg border border-rose-100 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 shadow-xs transition-colors hover:bg-rose-50"
        >
          <Plus size={14} /> Add Job
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-start gap-3 max-sm:flex-col">
            <div className="flex w-full flex-1 flex-col gap-1.5">
              <input
                type="text"
                placeholder="Job ID / Title"
                value={job.title}
                onChange={(e) => handleChange(job.id, "title", e.target.value)}
                className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                required
              />
            </div>
            <div className="flex w-full flex-1 items-center gap-3">
              <input
                type="number"
                placeholder="Amount (KES)"
                value={job.amount}
                onChange={(e) =>
                  handleChange(
                    job.id,
                    "amount",
                    e.target.value ? Number(e.target.value) : 0,
                  )
                }
                className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                required
              />
              <button
                type="button"
                onClick={() => handleRemove(job.id)}
                disabled={jobs.length <= 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total Amount Area */}
      <div className="mt-5 flex items-center justify-end border-t border-rose-200/60 pt-4">
        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white/60 px-3 py-2.5 text-sm font-semibold tracking-tight shadow-xs backdrop-blur-sm">
          <span className="inline-flex items-center gap-1 text-rose-700">
            <Wallet className="h-4 w-4" />
            Total Amount:
          </span>
          <span className="text-rose-900">
            KES {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
