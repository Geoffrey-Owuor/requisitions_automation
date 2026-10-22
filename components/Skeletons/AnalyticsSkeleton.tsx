// Stand-in for an analytics dashboard while its figures load, shaped like
// components/Analytics: six stat tiles, a full-width chart and a grid of
// chart cards.

const bar = "rounded-md bg-neutral-200";
const softBar = "rounded-md bg-neutral-100";

function CardSkeleton({ height }: { height: string }) {
  return (
    <div className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4">
      <div className="space-y-1.5">
        <div className={`h-3.5 w-40 ${bar}`} />
        <div className={`h-3 w-56 ${softBar}`} />
      </div>
      <div className={`rounded-control ${height} bg-neutral-100`} />
    </div>
  );
}

export default function AnalyticsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4"
          >
            <div className={`h-3 w-28 ${softBar}`} />
            <div className={`h-6 w-20 ${bar}`} />
            <div className={`h-3 w-32 ${softBar}`} />
          </div>
        ))}
      </div>
      <CardSkeleton height="h-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} height="h-40" />
        ))}
      </div>
    </div>
  );
}
