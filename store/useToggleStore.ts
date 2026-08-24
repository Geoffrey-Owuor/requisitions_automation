import { create } from "zustand";

interface ToggleButtonState {
  showITRequisition: boolean;
  showTravelRequisition: boolean;
  showAccessRequisition: boolean;
  showCasualRequisition: boolean;
  showEmployeeRequisition: boolean;
  scrollTrigger: boolean;
}

interface ToggleButtonActions {
  setShowITRequisition: (value: boolean) => void;
  setShowTravelRequisition: (value: boolean) => void;
  setShowAccessRequisition: (value: boolean) => void;
  setShowCasualRequisition: (value: boolean) => void;
  setShowEmployeeRequisition: (value: boolean) => void;
  triggerScroll: (value: boolean) => void;
  reset: () => void; //The reset function
}
// Create a new type that excludes 'scrollTrigger'
type ReducedToggleButtonState = Omit<ToggleButtonState, "scrollTrigger">;

const initialValues: ReducedToggleButtonState = {
  showITRequisition: false,
  showTravelRequisition: false,
  showAccessRequisition: false,
  showCasualRequisition: false,
  showEmployeeRequisition: false,
};

// Creating the store
export const useToggleStore = create<ToggleButtonState & ToggleButtonActions>()(
  (set) => ({
    // Initial states
    showITRequisition: false,
    showTravelRequisition: false,
    showAccessRequisition: false,
    showCasualRequisition: false,
    showEmployeeRequisition: false,
    scrollTrigger: false,

    // Actions
    setShowITRequisition: (value) => set({ showITRequisition: value }),
    setShowTravelRequisition: (value) => set({ showTravelRequisition: value }),
    setShowAccessRequisition: (value) => set({ showAccessRequisition: value }),
    setShowCasualRequisition: (value) => set({ showCasualRequisition: value }),
    setShowEmployeeRequisition: (value) =>
      set({ showEmployeeRequisition: value }),
    triggerScroll: (value) => set({ scrollTrigger: value }),
    reset: () => set(initialValues),
  }),
);
