import { create } from "zustand";

type AlertType = "success" | "error" | "";

export interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
  // How many times it has fired while on screen, shown as a pill from 2 up
  count: number;
  firedAt: number;
}

// The most shown at once, so a burst can't fill the screen. The oldest goes first.
const MAX_ALERTS = 4;

// A repeat this soon is one event firing twice (React runs effects twice in
// development), not something the user did again, so it doesn't add to the count
const SAME_EVENT_WINDOW_MS = 300;

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
  // back as the newest and gets its full time again, and adds to its count
  // rather than stacking copies
  triggerAlert: (type, message) =>
    set((state) => {
      const isSameAlert = (alert: AlertItem) =>
        alert.type === type && alert.message === message;
      const repeated = state.alerts.find(isSameAlert);
      const firedAt = Date.now();
      const isSameEvent =
        repeated && firedAt - repeated.firedAt < SAME_EVENT_WINDOW_MS;

      return {
        alerts: [
          ...state.alerts.filter((alert) => !isSameAlert(alert)),
          {
            id: nextAlertId++,
            type,
            message,
            count: (repeated?.count ?? 0) + (isSameEvent ? 0 : 1),
            firedAt,
          },
        ].slice(-MAX_ALERTS),
      };
    }),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),
}));
