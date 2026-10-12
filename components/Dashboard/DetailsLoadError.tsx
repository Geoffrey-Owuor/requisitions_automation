import { RotateCcw, TriangleAlert } from "lucide-react";

// Shown in a details modal when the part it fetches after opening (sections,
// positions) failed to load, or came back empty because the viewer may no
// longer see it
export function DetailsLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-neutral-50 px-4 py-6 text-center">
      <TriangleAlert size={20} className="text-neutral-400" />
      <p className="text-[13px] text-neutral-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
