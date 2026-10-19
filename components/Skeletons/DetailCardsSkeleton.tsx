// Stand-in for the section/position cards a details modal loads after it
// opens: a title with a meta line, a paragraph, and a row of figures.
// `withChips` adds the attachment row the Employee position cards have.
export function DetailCardsSkeleton({
  count = 2,
  withChips = false,
}: {
  count?: number;
  withChips?: boolean;
}) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-control bg-neutral-50 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-36 rounded-md bg-neutral-200" />
            <div className="h-3 w-28 rounded-md bg-neutral-200" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-md bg-neutral-200" />
            <div className="h-3 w-4/5 rounded-md bg-neutral-200" />
          </div>
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-20 rounded-md bg-neutral-200" />
            <div className="h-3 w-24 rounded-md bg-neutral-200" />
          </div>
          {withChips && (
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-compact h-7 w-32 bg-neutral-200" />
              <div className="rounded-compact h-7 w-24 bg-neutral-200" />
              <div className="rounded-compact h-7 w-28 bg-neutral-200" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
