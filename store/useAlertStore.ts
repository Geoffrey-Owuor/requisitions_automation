import { create } from "zustand";

type AlertType = "success" | "error" | "";

interface AlertState {
  // States
  showAlert: boolean;
  alertType: AlertType;
  alertMessage: string;

  // Actions
  triggerAlert: (type: AlertType, message: string) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>()((set) => ({
  showAlert: false,
  alertType: "",
  alertMessage: "",

  // The "convenience" setter
  triggerAlert: (type, message) =>
    set({
      showAlert: true,
      alertType: type,
      alertMessage: message,
    }),

  // The reset setter
  hideAlert: () =>
    set({
      showAlert: false,
      alertType: "",
      alertMessage: "",
    }),
}));
