import { create } from "zustand";

interface ToggleButtonState {
  showITRequisition: boolean;
  setShowITRequisition: (value: boolean) => void;

  showTravelRequisition: boolean;
  setShowTravelRequisition: (value: boolean) => void;

  showRetailForms: boolean;
  setShowRetailForms: (value: boolean) => void;

  showAccessRequisition: boolean;
  setShowAccessRequisition: (value: boolean) => void;

  scrollTrigger: boolean;
  triggerScroll: (value: boolean) => void;
}

// Creating the store
export const useToggleStore = create<ToggleButtonState>()((set) => ({
  // Initial states
  showITRequisition: false,
  showTravelRequisition: false,
  showRetailForms: false,
  showAccessRequisition: false,
  scrollTrigger: false,

  // Actions
  setShowITRequisition: (value) => set({ showITRequisition: value }),
  setShowTravelRequisition: (value) => set({ showTravelRequisition: value }),
  setShowRetailForms: (value) => set({ showRetailForms: value }),
  setShowAccessRequisition: (value) => set({ showAccessRequisition: value }),
  triggerScroll: (value) => set({ scrollTrigger: value }),
}));
