const RequisitionPdfSkeleton = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden p-5">
      <div className="relative z-10 mx-auto max-w-180 animate-pulse">
        {/* Header bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white/60 px-8 py-5">
          <div className="h-8 w-36 rounded-lg bg-gray-200" />
          <div className="h-9 w-28 rounded-xl bg-gray-200" />
        </div>

        {/* Title block */}
        <div className="mb-6 rounded-3xl border border-white/85 bg-white/65 px-10 py-7 backdrop-blur-2xl">
          <div className="mb-2 h-6 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-100" />
        </div>

        {/* Section card */}
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="mb-5 rounded-3xl border border-white/85 bg-white/65 px-10 py-7 backdrop-blur-2xl"
          >
            <div className="mb-5 h-4 w-36 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="h-5 w-40 rounded-lg bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Approval tier bar */}
        <div className="mb-5 rounded-3xl border border-white/85 bg-white/65 px-10 py-7 backdrop-blur-2xl">
          <div className="mb-5 h-4 w-36 rounded bg-gray-200" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 px-5 py-5">
                <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
                <div className="h-5 w-28 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionPdfSkeleton;
