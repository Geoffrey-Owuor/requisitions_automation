import { create } from "zustand";

interface ToggleButtonState {
  showITRequisition: boolean;
  showTravelRequisition: boolean;
  showRetailForms: boolean;
  showAccessRequisition: boolean;
  scrollTrigger: boolean;
  showHrForms: boolean;
}

interface ToggleButtonActions {
  setShowITRequisition: (value: boolean) => void;
  setShowTravelRequisition: (value: boolean) => void;
  setShowRetailForms: (value: boolean) => void;
  setShowAccessRequisition: (value: boolean) => void;
  triggerScroll: (value: boolean) => void;
  reset: () => void; //The reset function
  setShowHrForms: (value: boolean) => void;
}
// Create a new type that excludes 'scrollTrigger'
type ReducedToggleButtonState = Omit<ToggleButtonState, "scrollTrigger">;

const initialValues: ReducedToggleButtonState = {
  showITRequisition: false,
  showTravelRequisition: false,
  showRetailForms: false,
  showAccessRequisition: false,
  showHrForms: false,
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
    showHrForms: false,

    // Actions
    setShowITRequisition: (value) => set({ showITRequisition: value }),
    setShowTravelRequisition: (value) => set({ showTravelRequisition: value }),
    setShowRetailForms: (value) => set({ showRetailForms: value }),
    setShowAccessRequisition: (value) => set({ showAccessRequisition: value }),
    triggerScroll: (value) => set({ scrollTrigger: value }),
    reset: () => set(initialValues),
    setShowHrForms: (value) => set({ showHrForms: value }),
  }),
);
