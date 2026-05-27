import { create } from "zustand";

// Defining types
interface LoadingLineState {
  loadingLine: boolean;

  // The setter to just take a boolean directly
  setLoadingLine: (status: boolean) => void;
}

// Creating the store
export const useLoadingStore = create<LoadingLineState>()((set) => ({
  // Initial state
  loadingLine: false,
  // Action
  setLoadingLine: (status) => set({ loadingLine: status }),
}));
