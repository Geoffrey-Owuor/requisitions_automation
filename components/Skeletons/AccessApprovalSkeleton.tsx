const AccessApprovalSkeleton = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden p-5">
      <div className="relative z-10 mx-auto max-w-225 animate-pulse">
        {/* Banner image placeholder */}
        <div className="mb-4 h-30 rounded-xl bg-gray-200" />

        {/* Page header */}
        <div className="mb-8 space-y-2">
          <div className="h-3 w-32 rounded bg-rose-100" />
          <div className="h-7 w-64 rounded bg-gray-200" />
          <div className="h-4 w-52 rounded bg-gray-100" />
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-100 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
          {/* Approver badge */}
          <div className="mb-7 flex items-center gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-rose-100" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
            <div className="ml-auto h-6 w-20 rounded-lg bg-rose-100" />
          </div>

          {/* 2-column details grid */}
          <div className="mb-6 grid grid-cols-2 gap-8 max-sm:grid-cols-1">
            {/* Employee details column */}
            <div>
              <div className="mb-2.5 h-3 w-28 rounded bg-gray-200" />
              {/* Avatar row */}
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-100" />
                </div>
              </div>
              {/* Detail rows (Department, Staff No, Submitted, Requested By, Email) */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-2.5 flex items-center justify-between"
                >
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                </div>
              ))}
            </div>

            {/* Requisition details column */}
            <div>
              <div className="mb-2.5 h-3 w-28 rounded bg-gray-200" />
              {/* Detail rows (Only Issuance Date for Access) */}
              <div className="mb-2.5 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-3 w-28 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Access Requirements (Locations and Permissions) */}
          <div className="mb-6 grid grid-cols-2 gap-8 border-t border-[rgba(240,180,180,0.4)] pt-6 max-sm:grid-cols-1">
            {/* Locations */}
            <div>
              <div className="mb-2.5 h-3 w-24 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-7 w-20 rounded-lg bg-rose-50" />
                ))}
              </div>
            </div>

            {/* Permissions / Keys */}
            <div>
              <div className="mb-2.5 h-3 w-32 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-7 w-24 rounded-lg bg-rose-50" />
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
            <div className="mb-2.5 h-3 w-20 rounded bg-gray-200" />
            <div className="h-28 rounded-2xl bg-gray-50" />
            <div className="mt-1.5 h-3 w-36 rounded bg-gray-100" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <div className="h-14 flex-1 rounded-[14px] bg-rose-50" />
            <div className="h-14 flex-1 rounded-[14px] bg-gray-200" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <div className="h-3 w-64 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
};

export default AccessApprovalSkeleton;
