// TravelApprovalSkeleton.tsx

export default function TravelApprovalSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden p-4">
      <div className="relative z-10 mx-auto max-w-225 animate-pulse">
        {/* Image placeholder */}
        <div className="mb-4 h-30 rounded-xl bg-rose-100/60" />

        {/* Header placeholder */}
        <div className="mb-8">
          <div className="mb-2 h-7 w-64 rounded-lg bg-rose-100/70" />
          <div className="h-4 w-44 rounded-lg bg-rose-100/50" />
        </div>

        {/* Card shell */}
        <div className="rounded-3xl border border-gray-100 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
          {/* Step label */}
          <div className="mb-5">
            <div className="mb-2 h-3 w-24 rounded-full bg-rose-100/70" />
            <div className="mb-1 h-5 w-52 rounded-lg bg-rose-100/60" />
            <div className="h-3.5 w-72 rounded-full bg-rose-100/40" />
          </div>

          {/* Approver badge */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-rose-100/70" />
            <div className="flex-1">
              <div className="mb-1.5 h-3.5 w-32 rounded-lg bg-rose-100/70" />
              <div className="h-3 w-48 rounded-full bg-rose-100/40" />
            </div>
            <div className="h-6 w-20 rounded-lg bg-rose-100/50" />
          </div>

          {/* Two-column grid */}
          <div className="mb-5 grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {[0, 1].map((col) => (
              <div key={col}>
                <div className="mb-3 h-3 w-28 rounded-full bg-rose-100/60" />
                <div className="flex flex-col gap-2.5">
                  {Array.from({ length: col === 0 ? 5 : 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 w-20 rounded-full bg-rose-100/50" />
                      <div className="h-3 w-24 rounded-full bg-rose-100/60" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Justification block */}
          <div className="mb-5 border-t border-[rgba(240,180,180,0.4)] pt-5">
            <div className="mb-3 h-3 w-36 rounded-full bg-rose-100/60" />
            <div className="flex flex-col gap-2 rounded-xl bg-white/60 py-3">
              <div className="h-3 w-full rounded-full bg-rose-100/40" />
              <div className="h-3 w-5/6 rounded-full bg-rose-100/40" />
              <div className="h-3 w-4/6 rounded-full bg-rose-100/40" />
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="mb-5 border-t border-[rgba(240,180,180,0.4)] pt-5">
            <div className="mb-3 h-3 w-40 rounded-full bg-rose-100/60" />
            <div className="mb-3 grid grid-cols-3 gap-2 max-sm:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-gray-100 px-3 py-2.5 text-center"
                >
                  <div className="mx-auto mb-1.5 h-3 w-14 rounded-full bg-rose-100/60" />
                  <div className="mx-auto h-4 w-16 rounded-lg bg-rose-100/70" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14.5 rounded-2xl bg-slate-900/10" />
              <div className="h-14.5 rounded-2xl bg-rose-900/10" />
            </div>
          </div>

          {/* Comments area */}
          <div className="mb-5 border-t border-[rgba(240,180,180,0.4)] pt-5">
            <div className="mb-3 h-3 w-28 rounded-full bg-rose-100/60" />
            <div className="h-28 rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <div className="h-13.5 flex-1 rounded-[14px] bg-rose-100/60" />
            <div className="h-13.5 flex-1 rounded-[14px] bg-slate-900/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
