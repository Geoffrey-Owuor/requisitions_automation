"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import ClientPortal from "../ClientPortal";
import Brand from "../Brand";
import { useToggleStore } from "@/store/useToggleStore";

interface ModalWrapperProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}

const UnsavedChangesContext = createContext<
  ((hasUnsavedChanges: boolean) => void) | null
>(null);

// Called by a form inside a ModalWrapper to say whether it holds input that
// closing the modal would throw away (the form unmounts on close). While it
// does, every way of closing - the X, a click outside, Escape - asks first,
// and so does the browser on a refresh or when the tab is closed.
export function useReportUnsavedChanges(hasUnsavedChanges: boolean) {
  const report = useContext(UnsavedChangesContext);

  useEffect(() => {
    report?.(hasUnsavedChanges);
  }, [report, hasUnsavedChanges]);

  useEffect(() => () => report?.(false), [report]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Browsers show their own generic "Leave site?" prompt; custom text is
    // ignored. returnValue is still needed by some older browsers.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

const ModalWrapper = ({ isOpen, onClose, children }: ModalWrapperProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);

  const modalWrapperRef = useRef<HTMLDivElement | null>(null);

  // Only read when closing, so a ref avoids re-rendering on every keystroke
  const hasUnsavedChangesRef = useRef(false);
  const reportUnsavedChanges = useCallback((hasUnsavedChanges: boolean) => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, []);

  const requestClose = useCallback(() => {
    if (hasUnsavedChangesRef.current) setConfirmingDiscard(true);
    else onClose();
  }, [onClose]);

  const discardAndClose = () => {
    setConfirmingDiscard(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => setShouldRender(true));
      // Small double-frame delay ensures the DOM registers the initial state before animating
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      return () => cancelAnimationFrame(frame);
    } else {
      Promise.resolve().then(() => setAnimate(false));
      const timer = setTimeout(() => setShouldRender(false), 200); // Match duration-200
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape closes the modal, or backs out of the discard prompt if it's up
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (confirmingDiscard) setConfirmingDiscard(false);
      else requestClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmingDiscard, requestClose]);

  // Listen for the Zustand trigger change
  useEffect(() => {
    const executeScroll = () => {
      requestAnimationFrame(() => {
        modalWrapperRef.current?.scrollTo({ top: 0, behavior: "instant" });
      });
    };

    executeScroll();
  }, [scrollTrigger]);

  if (!shouldRender) return null;

  return (
    <ClientPortal>
      {/* Backdrop transition */}
      <div
        onClick={requestClose}
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-200 ease-in-out ${
          animate ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Modal Panel - on desktop it covers exactly the #dashboard-wrapper
            area (see DashboardWrapper), leaving only the sidebar outside it */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="custom:absolute custom:inset-y-2 custom:right-2 custom:left-20 custom:h-auto custom:w-auto custom:rounded-2xl relative flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <Brand showText={true} />
            <button
              onClick={requestClose}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            ref={modalWrapperRef}
            className="normal-scrollbar min-h-0 w-full flex-1 overflow-y-auto bg-white p-2"
          >
            <UnsavedChangesContext.Provider value={reportUnsavedChanges}>
              {children}
            </UnsavedChangesContext.Provider>
          </div>

          {confirmingDiscard && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-5">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-form-title"
                aria-describedby="discard-form-message"
                className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              >
                <h2
                  id="discard-form-title"
                  className="text-lg font-semibold tracking-[-0.3px] text-[#1e1b1b]"
                >
                  Discard this form?
                </h2>
                <p
                  id="discard-form-message"
                  className="mt-2 text-[13px] leading-relaxed text-[#7c5a5a]"
                >
                  You have unsaved changes. If you close now, everything
                  you&apos;ve entered will be lost.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    autoFocus
                    onClick={() => setConfirmingDiscard(false)}
                    className="flex-1 cursor-pointer rounded-[14px] bg-slate-900 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Keep editing
                  </button>
                  <button
                    onClick={discardAndClose}
                    className="flex-1 cursor-pointer rounded-[14px] border border-rose-200 bg-rose-50 py-3 text-[14px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientPortal>
  );
};

export default ModalWrapper;
