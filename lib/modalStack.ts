import { useSyncExternalStore } from "react";

// The open modal <dialog>s, oldest first. A modal dialog makes everything
// outside it inert, so whatever must stay clickable above it has to render
// inside the topmost one (see components/Modules/AlertLayer.tsx).
let openModals: HTMLDialogElement[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// Call for the time a dialog is open; returns the matching cleanup
export function trackOpenModal(dialog: HTMLDialogElement) {
  openModals = [...openModals, dialog];
  emitChange();
  return () => {
    openModals = openModals.filter((openModal) => openModal !== dialog);
    emitChange();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTopModal() {
  return useSyncExternalStore(
    subscribe,
    () => openModals.at(-1) ?? null,
    () => null,
  );
}
