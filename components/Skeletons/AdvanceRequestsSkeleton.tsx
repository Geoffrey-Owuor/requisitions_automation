// Stand-ins for the salary advance form's "Modify Existing Request" lists
// while they load: `history` mirrors a SalaryAdvanceHistorySection row
// (summary, repayment date, status pill), `alteration` mirrors a
// SalaryAdvanceAlterationSection card (summary plus an action row).
export function AdvanceRequestsSkeleton({
  variant,
  label,
}: {
  variant: "history" | "alteration";
  // Announced to screen readers in place of the old spinner text
  label: string;
}) {
  return (
    <div className="animate-pulse" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3" aria-hidden="true">
        {variant === "alteration" && (
          <div className="mb-1 h-3 w-3/4 rounded-full bg-slate-200" />
        )}
        {Array.from({ length: variant === "history" ? 3 : 1 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3.5 w-52 max-w-full rounded-full bg-slate-200" />
                <div className="h-3 w-40 rounded-full bg-slate-100" />
              </div>
              {variant === "history" && (
                <div className="h-5 w-20 shrink-0 rounded-full bg-slate-100" />
              )}
            </div>
            {variant === "alteration" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="h-3 w-56 max-w-full rounded-full bg-slate-100" />
                <div className="h-10 w-36 rounded-xl bg-slate-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
