const SalaryAdvanceFormSkeleton = () => {
  return (
    <div className="relative z-10 mx-auto w-full max-w-225 animate-pulse">
      {/* Form image placeholder */}
      <div className="mb-4 h-40 rounded-2xl bg-gray-200 sm:rounded-3xl" />

      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="h-6 w-56 rounded bg-gray-200" />
        <div className="h-3.5 w-64 rounded bg-gray-100" />
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
        {/* Staff Information */}
        <div>
          <div className="mb-5 h-3.5 w-36 rounded bg-rose-100" />
          <div className="mb-4 h-3 w-full max-w-96 rounded bg-gray-100" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-10 w-full rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        <hr className="my-8 border-[rgba(240,180,180,0.6)]" />

        {/* Advance Details */}
        <div>
          <div className="mb-5 h-3.5 w-36 rounded bg-rose-100" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-3 w-28 rounded bg-gray-100" />
                <div className="h-10 w-full rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Policy & Disclaimer */}
        <div className="mt-8 rounded-2xl bg-red-50/30 p-6 shadow-inner">
          <div className="mb-3 h-4 w-56 rounded bg-gray-200" />
          <div className="mb-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded bg-gray-100" />
            ))}
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="flex items-start gap-3 rounded-xl p-4">
            <div className="h-5 w-5 shrink-0 rounded bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-8 h-14 w-full rounded-xl bg-gray-200" />
      </div>
    </div>
  );
};

export default SalaryAdvanceFormSkeleton;
