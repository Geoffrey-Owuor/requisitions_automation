"use client";

import { useState } from "react";
import { X, Mail, TriangleAlert, Send } from "lucide-react";
import ClientPortal from "@/components/ClientPortal";
import CustomDropdown, { DropdownOption } from "./CustomDropDown";
import { useAlertStore } from "@/store/useAlertStore";
import { SubmitEmailChangeRequest } from "@/serverActions/PublicServerActions/SubmitEmailChangeRequest";
import {
  EMAIL_CHANGE_REASONS,
  EmailChangeRequestInput,
} from "@/lib/emailChangeRequest";

interface EmailChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Prefilled when the requester is already signed into the advance form.
  defaults?: { staffNumber?: string; staffName?: string; department?: string };
}

const REASON_OPTIONS: DropdownOption[] = EMAIL_CHANGE_REASONS.map((reason) => ({
  label: reason,
  value: reason,
}));

const inputClass =
  "h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]";

const buildInitialState = (
  defaults: EmailChangeRequestModalProps["defaults"],
): EmailChangeRequestInput => ({
  staffNumber: defaults?.staffNumber ?? "",
  staffName: defaults?.staffName ?? "",
  department: defaults?.department ?? "",
  reason: "",
  newEmail: "",
  confirmEmail: "",
  ownershipConfirmed: false,
  website: "",
});

export default function EmailChangeRequestModal({
  isOpen,
  onClose,
  defaults,
}: EmailChangeRequestModalProps) {
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  const [form, setForm] = useState<EmailChangeRequestInput>(() =>
    buildInitialState(defaults),
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const update = <K extends keyof EmailChangeRequestInput>(
    field: K,
    value: EmailChangeRequestInput[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const emailsMismatch =
    form.confirmEmail !== "" &&
    form.newEmail.trim().toLowerCase() !==
      form.confirmEmail.trim().toLowerCase();

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason) {
      triggerAlert("error", "Please choose a reason for the change.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await SubmitEmailChangeRequest(form);
      triggerAlert(response.type, response.message);
      if (response.type === "success") {
        setForm(buildInitialState(defaults));
        onClose();
      }
    } catch (error) {
      triggerAlert("error", String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClientPortal>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto w-full max-w-lg rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Request an email change
                </h2>
                <p className="text-xs text-gray-600">
                  HR reviews every request before changing anything.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Close"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="layout-scrollbar max-h-70 space-y-4 overflow-y-auto p-6">
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Enter the new address carefully and make sure you own it and
                  can read its mail. HR will use it to contact you, and a wrong
                  or unowned address could send your salary advance
                  notifications to someone else. Your current address on file
                  will also be notified of this request.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#7c5a5a]">
                    Staff Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={50}
                    className={inputClass}
                    value={form.staffNumber}
                    onChange={(e) => update("staffNumber", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#7c5a5a]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={255}
                    autoComplete="name"
                    className={inputClass}
                    value={form.staffName}
                    onChange={(e) => update("staffName", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#7c5a5a]">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  maxLength={255}
                  className={inputClass}
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                />
              </div>

              <CustomDropdown
                label="Reason for the change"
                options={REASON_OPTIONS}
                value={form.reason}
                onChange={(value) => update("reason", String(value))}
              />

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#7c5a5a]">
                  New Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="off"
                  placeholder="you@example.com"
                  className={inputClass}
                  value={form.newEmail}
                  onChange={(e) => update("newEmail", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#7c5a5a]">
                  Confirm New Email Address{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="off"
                  onPaste={(e) => e.preventDefault()}
                  className={inputClass}
                  value={form.confirmEmail}
                  onChange={(e) => update("confirmEmail", e.target.value)}
                />
                {emailsMismatch && (
                  <p className="text-[11.5px] text-rose-600">
                    The email addresses do not match.
                  </p>
                )}
              </div>

              {/* Honeypot: hidden from people, bots tend to fill it in. */}
              <div aria-hidden="true" className="sr-only">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-rose-600"
                  checked={form.ownershipConfirmed}
                  onChange={(e) =>
                    update("ownershipConfirmed", e.target.checked)
                  }
                />
                I confirm that I own this email address and that the details
                above are accurate.
              </label>
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <button
                type="submit"
                disabled={submitting || emailsMismatch}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ClientPortal>
  );
}
