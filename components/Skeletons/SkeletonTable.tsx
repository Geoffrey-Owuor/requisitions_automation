export const SkeletonTable = () => {
  return (
    <div className="rounded-control z-10 mb-4 w-full border border-neutral-300 p-3">
      <div className="animate-pulse space-y-4">
        {/* Table Title Placeholder */}
        <div className="rounded-compact mb-4 h-6 w-64 bg-neutral-200" />
        <div className="rounded-control mb-6 h-10 w-full max-w-100 bg-neutral-200" />

        {/* Table Container */}
        <div className="rounded-surface h-full w-full border border-gray-200 bg-white px-4 py-2">
          {/* Table Header Row */}
          <div className="flex space-x-4 border-b border-neutral-200/50 py-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-compact h-4 w-full bg-neutral-200"
              />
            ))}
          </div>

          {/* Table Body Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-4">
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="rounded-control h-8 w-full bg-neutral-100"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
