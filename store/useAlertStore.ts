import { create } from "zustand";

type AlertType = "success" | "error" | "";

export interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
}

// The most shown at once, so a burst can't fill the screen. The oldest goes first.
const MAX_ALERTS = 4;

let nextAlertId = 0;

interface AlertState {
  // Oldest first
  alerts: AlertItem[];

  triggerAlert: (type: AlertType, message: string) => void;
  dismissAlert: (id: number) => void;
}

export const useAlertStore = create<AlertState>()((set) => ({
  alerts: [],

  // Repeating an alert still on screen replaces it, with a new id so it comes
  // back as the newest and gets its full time again, rather than stacking copies
  triggerAlert: (type, message) =>
    set((state) => ({
      alerts: [
        ...state.alerts.filter(
          (alert) => alert.type !== type || alert.message !== message,
        ),
        { id: nextAlertId++, type, message },
      ].slice(-MAX_ALERTS),
    })),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),
}));
