const RequisitionPdfSkeleton = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden p-4">
      <div className="relative z-10 mx-auto max-w-3xl animate-pulse">
        {/* Header bar */}
        <div className="rounded-surface mb-6 flex items-center justify-between bg-white/60 px-8 py-5">
          <div className="rounded-control h-8 w-36 bg-gray-200" />
          <div className="rounded-control h-9 w-28 bg-gray-200" />
        </div>

        {/* Title block */}
        <div className="rounded-surface mb-6 border border-white/85 bg-white/65 px-10 py-7">
          <div className="rounded-compact mb-2 h-6 w-64 bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-100" />
        </div>

        {/* Section card */}
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="rounded-surface mb-5 border border-white/85 bg-white/65 px-10 py-7"
          >
            <div className="mb-5 h-4 w-36 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="rounded-compact h-5 w-40 bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Approval tier bar */}
        <div className="rounded-surface mb-5 border border-white/85 bg-white/65 px-10 py-7">
          <div className="mb-5 h-4 w-36 rounded bg-gray-200" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-surface bg-gray-100 px-5 py-5">
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
