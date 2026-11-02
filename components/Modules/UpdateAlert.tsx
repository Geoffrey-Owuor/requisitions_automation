"use client";

import { RefreshCw } from "lucide-react";

// Stays until acted on, unlike the toasts in Alert.tsx. Reloading goes through
// the browser's beforeunload prompt on a form with unsaved changes.
const UpdateAlert = ({ onLater }: { onLater: () => void }) => {
  return (
    <div role="status" className="animate-slideUp pointer-events-auto">
      <div className="rounded-surface relative flex items-start gap-3 overflow-hidden bg-black p-4">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-sky-500" />

        <div className="rounded-control flex h-10 w-10 shrink-0 items-center justify-center bg-sky-500/20">
          <RefreshCw className="h-5 w-5 text-sky-400" />
        </div>

        <div className="flex flex-1 flex-col pt-0.5">
          <h3 className="text-sm font-bold tracking-tight text-white">
            Update available
          </h3>
          <p className="mt-0.5 text-[13px] text-neutral-200">
            A new version of Apps Hub is ready. Reload to start using it.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onLater}
              className="rounded-control px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-control bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateAlert;
