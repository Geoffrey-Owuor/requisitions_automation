"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "../Modal";

type UnsavedChangesGuard = {
  report: (hasUnsavedChanges: boolean) => void;
  confirmLeave: (leave: () => void) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesGuard | null>(null);

// Called by a requisition form page to say whether it holds input that
// leaving would throw away. While it does, in-app links and the dashboard's
// Back button ask first, and the browser asks on a refresh or when the tab
// is closed. The browser's own Back button can't be intercepted in the App
// Router, so it isn't guarded.
export function useReportUnsavedChanges(hasUnsavedChanges: boolean) {
  const report = useContext(UnsavedChangesContext)?.report;

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

// For navigation that isn't a link click (e.g. router.back()): runs `leave`
// straight away, or after the user agrees to discard their input.
export function useConfirmLeave() {
  const confirmLeave = useContext(UnsavedChangesContext)?.confirmLeave;
  return useCallback(
    (leave: () => void) => (confirmLeave ? confirmLeave(leave) : leave()),
    [confirmLeave],
  );
}

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Only read when leaving, so a ref avoids re-rendering on every keystroke
  const hasUnsavedChangesRef = useRef(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  const report = useCallback((hasUnsavedChanges: boolean) => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, []);

  const confirmLeave = useCallback((leave: () => void) => {
    if (hasUnsavedChangesRef.current) setPendingLeave(() => leave);
    else leave();
  }, []);

  // Catch same-origin link clicks before they navigate. preventDefault in the
  // capture phase still lets the link's own onClick run (closing menus and
  // drawers), while next/link and the browser both skip the navigation.
  // Cross-origin and new-tab links are left alone - the former unload the
  // page, which beforeunload already covers.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChangesRef.current || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      e.preventDefault();
      setPendingLeave(
        () => () => router.push(`${url.pathname}${url.search}${url.hash}`),
      );
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  const discardAndLeave = () => {
    const leave = pendingLeave;
    setPendingLeave(null);
    leave?.();
  };

  return (
    <UnsavedChangesContext.Provider value={{ report, confirmLeave }}>
      {children}

      {/* Stays mounted so its close transition can play */}
      <AlertDialog
        open={!!pendingLeave}
        onClose={() => setPendingLeave(null)}
        labelledBy="discard-form-title"
        describedBy="discard-form-message"
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
          You have unsaved changes. If you leave now, everything you&apos;ve
          entered will be lost.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setPendingLeave(null)}
            className="flex-1 cursor-pointer rounded-[14px] bg-slate-900 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={discardAndLeave}
            className="flex-1 cursor-pointer rounded-[14px] border border-rose-200 bg-rose-50 py-3 text-[14px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            Discard
          </button>
        </div>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
