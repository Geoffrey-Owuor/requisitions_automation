import { create } from "zustand";

// Route-change progress for LoadingLine. Navigations start it from
// instrumentation-client.ts; LoadingLine finishes it when the path changes.
interface LoadingLineState {
  navigating: boolean;
  startNavigation: () => void;
  finishNavigation: () => void;
}

export const useLoadingStore = create<LoadingLineState>()((set) => ({
  navigating: false,
  startNavigation: () => set({ navigating: true }),
  finishNavigation: () => set({ navigating: false }),
}));
