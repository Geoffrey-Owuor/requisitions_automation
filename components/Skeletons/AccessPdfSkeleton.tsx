// AccessPdfSkeleton.tsx

export default function AccessPdfSkeleton() {
  return (
    <div className="relative py-4 font-sans">
      <div className="relative z-10 mx-auto max-w-180 animate-pulse">
        {/* Toolbar Skeleton */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 px-6 py-4 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
          <div className="h-4 w-48 rounded-lg bg-rose-100/70" />
          <div className="h-10 w-36 rounded-[14px] bg-slate-200/70" />
        </div>

        {/* Document Shell */}
        <div className="rounded-3xl border border-white/85 bg-white/65 px-10 py-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
          {/* Header */}
          <div className="mb-8 border-b border-[rgba(240,180,180,0.4)] pb-6">
            <div className="mb-3 h-8 w-72 rounded-lg bg-rose-100/70" />
            <div className="h-4 w-60 rounded-full bg-rose-100/50" />
          </div>

          {/* Employee Info */}
          <div className="mb-8">
            <div className="mb-5 h-3.5 w-32 rounded-full bg-rose-100/70" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              {/* Access has 3 fields here: Name, Staff Number, Department */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-24 rounded-full bg-rose-100/50" />
                  <div className="h-4 w-36 rounded-lg bg-rose-100/60" />
                </div>
              ))}
            </div>
          </div>

          {/* Request Info */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <div className="mb-5 h-3.5 w-28 rounded-full bg-rose-100/70" />
            <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              {/* Access has 1 field here: Issuance Date */}
              <div className="flex flex-col gap-2">
                <div className="h-3 w-28 rounded-full bg-rose-100/50" />
                <div className="h-4 w-40 rounded-lg bg-rose-100/60" />
              </div>
            </div>

            {/* Access Locations (Text Block) */}
            <div className="mb-6">
              <div className="mb-3 h-3 w-32 rounded-full bg-rose-100/50" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-full rounded-full bg-rose-100/40" />
                <div className="h-3 w-4/5 rounded-full bg-rose-100/40" />
              </div>
            </div>

            {/* Permissions / Keys (Text Block) */}
            <div>
              <div className="mb-3 h-3 w-44 rounded-full bg-rose-100/50" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-full rounded-full bg-rose-100/40" />
                <div className="h-3 w-5/6 rounded-full bg-rose-100/40" />
                <div className="h-3 w-2/3 rounded-full bg-rose-100/40" />
              </div>
            </div>
          </div>

          {/* Approval Chain */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <div className="mb-5 h-3.5 w-32 rounded-full bg-rose-100/70" />
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              {/* HOD Card Skeleton */}
              <div className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
                <div className="mb-3 h-3 w-24 rounded-full bg-rose-100/50" />
                <div className="mb-4 h-4 w-36 rounded-lg bg-rose-100/70" />
                <div className="mb-4 h-6 w-20 rounded-full bg-rose-100/60" />
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="h-2.5 w-full rounded-full bg-rose-100/40" />
                  <div className="h-2.5 w-4/5 rounded-full bg-rose-100/40" />
                </div>
              </div>

              {/* Security Card Skeleton */}
              <div className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
                <div className="mb-3 h-3 w-32 rounded-full bg-rose-100/50" />
                <div className="mb-4 h-4 w-40 rounded-lg bg-rose-100/70" />
                <div className="mb-4 h-6 w-20 rounded-full bg-rose-100/60" />
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="h-2.5 w-full rounded-full bg-rose-100/40" />
                  <div className="h-2.5 w-3/5 rounded-full bg-rose-100/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
