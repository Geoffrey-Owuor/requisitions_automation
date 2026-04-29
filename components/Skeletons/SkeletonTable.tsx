export const SkeletonTable = () => {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Table Title Placeholder */}
      <div className="mb-6 h-10 w-64 rounded-xl bg-neutral-200/60" />

      {/* Table Container */}
      <div className="h-96 w-full rounded-2xl border border-white/80 bg-white/40 backdrop-blur-md">
        {/* Table Header Row */}
        <div className="flex space-x-4 border-b border-neutral-200/50 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full rounded-lg bg-neutral-200/60" />
          ))}
        </div>

        {/* Table Body Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex space-x-4 p-4">
            {[...Array(5)].map((_, j) => (
              <div
                key={j}
                className="h-8 w-full rounded-lg bg-neutral-100/60"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
