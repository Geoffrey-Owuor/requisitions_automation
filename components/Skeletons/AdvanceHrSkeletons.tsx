// Stand-ins for the salary advance HR dashboard's email change requests
// while they load, shaped like the request cards

const bar = "rounded-md bg-neutral-200";
const softBar = "rounded-md bg-neutral-100";

function DetailBoxSkeleton() {
  return (
    <div className="rounded-control grid grid-cols-2 gap-2 bg-neutral-50 p-3">
      <div className={`col-span-2 h-2.5 w-20 ${softBar}`} />
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className={`h-2.5 w-16 ${softBar}`} />
          <div className={`h-3.5 w-32 ${bar}`} />
        </div>
      ))}
    </div>
  );
}

export function EmailChangeRequestsSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <span className="sr-only">Loading the email change requests</span>
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className={`h-3.5 w-48 ${bar}`} />
                <div className={`h-3 w-64 ${softBar}`} />
              </div>
              <div className="flex gap-2">
                <div className="rounded-control h-8 w-16 border border-neutral-200" />
                <div className="rounded-control h-8 w-28 bg-neutral-200" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailBoxSkeleton />
              <DetailBoxSkeleton />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
