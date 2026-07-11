import { create } from "zustand";

interface ToggleButtonState {
  showITRequisition: boolean;
  showTravelRequisition: boolean;
  showRetailForms: boolean;
  showAccessRequisition: boolean;
  scrollTrigger: boolean;
}

interface ToggleButtonActions {
  setShowITRequisition: (value: boolean) => void;
  setShowTravelRequisition: (value: boolean) => void;
  setShowRetailForms: (value: boolean) => void;
  setShowAccessRequisition: (value: boolean) => void;
  triggerScroll: (value: boolean) => void;
  reset: () => void; //The reset function
}
// Create a new type that excludes 'scrollTrigger'
type ReducedToggleButtonState = Omit<ToggleButtonState, "scrollTrigger">;

const initialValues: ReducedToggleButtonState = {
  showITRequisition: false,
  showTravelRequisition: false,
  showRetailForms: false,
  showAccessRequisition: false,
};

// Creating the store
export const useToggleStore = create<ToggleButtonState & ToggleButtonActions>()(
  (set) => ({
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
    reset: () => set(initialValues),
  }),
);
