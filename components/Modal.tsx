"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

// Shared modal shells on the native <dialog> element (styles: "Modals" in
// css/globals.css). showModal() puts the dialog in the top layer, so no
// portal or z-index is needed, and gives Escape, focus containment and an
// inert page behind it. The dialog stays mounted while closed so its exit
// transition can play: keep rendering the last content after `open` turns
// false rather than returning null.

// For a modal whose parent clears its data on close (`request={null}`): keeps
// returning the last non-null value so the exit transition still has content
export function useLastDefined<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}

function useModalDialog(open: boolean, focusDialog: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start keyboard focus on the dialog itself instead of the first
      // control, which would be an action link or the close button
      if (focusDialog) dialog.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, focusDialog]);

  return ref;
}

// Escape goes through onClose so the parent's state stays the source of truth.
// React bubbles the synthetic cancel event up the component tree, so a dialog
// nested inside another (an attachment preview over a details modal) would
// otherwise close its parent too.
function cancelHandler(onClose: () => void) {
  return (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    onClose();
  };
}

// A click whose target is the dialog element itself landed on the backdrop:
// every visible part of the panel is covered by a child element
function backdropClickHandler(onClose: () => void) {
  return (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  // Small leading badge, e.g. the requisition type's icon
  icon?: ReactNode;
  // Links/buttons shown in the header on desktop and in a bottom bar on
  // phones. Style them with modalActionClass.
  actions?: ReactNode;
  // Full-width bar under the body, e.g. a form's Cancel/Submit buttons
  footer?: ReactNode;
  // Max width from sm up, as a utility class
  widthClassName?: string;
  bodyClassName?: string;
  // From sm up, let popovers (date pickers, dropdowns) extend past the card
  // instead of scrolling inside it. Only for short modals that never need to
  // scroll on desktop.
  overflowVisible?: boolean;
  children: ReactNode;
}

// Content modal: full screen on phones, a centred card from sm up
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  actions,
  footer,
  widthClassName = "sm:max-w-2xl",
  bodyClassName = "space-y-4 p-5 sm:p-6",
  overflowVisible = false,
  children,
}: ModalProps) {
  const ref = useModalDialog(open, true);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      onCancel={cancelHandler(onClose)}
      onClick={backdropClickHandler(onClose)}
      className={`modal modal-sheet ${widthClassName} ${overflowVisible ? "sm:overflow-visible" : ""}`}
    >
      <div className="modal-sheet-head flex min-w-0 items-center gap-3 py-4 pl-5 sm:pl-8">
        {icon && (
          <div className="rounded-control flex h-9 w-9 shrink-0 items-center justify-center bg-white shadow-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2
            id={titleId}
            className="truncate text-sm font-semibold text-[#1e1b1b]"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-[11px] text-neutral-500">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="modal-sheet-actions flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 pt-3 sm:gap-3 sm:border-0 sm:py-4 sm:pr-2 sm:pl-4">
          {actions}
        </div>
      )}

      <div className="modal-sheet-close flex items-center py-4 pr-4 pl-2 sm:pr-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-control p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
        >
          <X size={18} />
        </button>
      </div>

      <div
        className={`modal-sheet-body border-t border-neutral-100 ${overflowVisible ? "sm:overflow-visible" : ""} ${bodyClassName}`}
      >
        {children}
      </div>

      {footer && (
        <div className="modal-sheet-foot sm:rounded-b-surface flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  // ids of the title/message elements inside children
  labelledBy: string;
  describedBy?: string;
  className?: string;
  children: ReactNode;
}

// Confirmation: a bottom sheet on phones, a small centred card from sm up.
// Focus starts on the first focusable control, so put the safe choice first.
export function AlertDialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  className = "p-6",
  children,
}: AlertDialogProps) {
  const ref = useModalDialog(open, false);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={cancelHandler(onClose)}
      onClick={backdropClickHandler(onClose)}
      className="modal modal-alert"
    >
      <div className={className}>{children}</div>
    </dialog>
  );
}

// Pill links/buttons for Modal's actions slot: compact in the desktop
// header, full-size touch targets in the phone action bar
const MODAL_ACTION_BASE =
  "inline-flex items-center justify-center gap-1 rounded-compact max-sm:rounded-control px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 max-sm:flex-1 max-sm:px-4 max-sm:py-2.5 max-sm:text-sm";

export const modalActionClass = {
  dark: `${MODAL_ACTION_BASE} bg-slate-900 hover:bg-slate-800`,
  amber: `${MODAL_ACTION_BASE} bg-amber-500 hover:bg-amber-600`,
};

// Placeholder for an action whose link is still loading, sized to match
export function ModalActionSkeleton() {
  return (
    <div className="rounded-compact max-sm:rounded-control h-6 w-20 animate-pulse bg-neutral-200 max-sm:h-10 max-sm:flex-1" />
  );
}
