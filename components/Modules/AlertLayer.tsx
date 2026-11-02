"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Alerts from "@/components/Modules/Alert";
import { useTopModal } from "@/lib/modalStack";

const subscribeToNothing = () => () => {};

// Holds the app's alerts above everything, stacked in one corner. A manual
// popover sits in the top layer, above any open modal, but a modal makes
// everything outside it inert: a click on a popover outside lands on the dialog
// instead, which Modal treats as a backdrop click. So while a modal is open the
// layer renders inside it. Changing the portal's container remounts the layer,
// which also shows it after the new modal, on top of it. React events still
// bubble to this component rather than the dialog.
//
// On phones a modal keeps its action buttons along the bottom, so the layer
// moves to the top of the screen while one is open.
const AlertLayer = () => {
  const topModal = useTopModal();
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const layerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (layer && !layer.matches(":popover-open")) layer.showPopover();
  }, [topModal, isClient]);

  if (!isClient) return null;

  return createPortal(
    <div
      ref={layerRef}
      popover="manual"
      className={`pointer-events-none fixed inset-auto right-4 left-4 m-0 flex w-auto flex-col gap-2 overflow-visible border-0 bg-transparent p-0 sm:right-6 sm:bottom-6 sm:left-auto sm:w-auto sm:max-w-md sm:min-w-[320px] ${
        topModal
          ? "max-sm:top-[max(1rem,env(safe-area-inset-top))]"
          : "bottom-4"
      }`}
    >
      <Alerts />
    </div>,
    topModal ?? document.body,
  );
};

export default AlertLayer;
