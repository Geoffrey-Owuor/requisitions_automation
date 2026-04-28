export const SkeletonTable = () => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="mb-6 h-10 w-64 rounded-lg bg-rose-100/50" />
      <div className="h-96 w-full rounded-2xl border border-white/80 bg-white/40 backdrop-blur-md">
        <div className="flex space-x-4 border-b border-rose-100/50 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-rose-100/60" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex space-x-4 p-4">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-8 w-full rounded-lg bg-rose-50/50" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
