"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { DatePicker } from "../DatePicker";
import {
  ArrowRight,
  FileText,
  Check,
  UserRound,
  CircleDollarSign,
  Lightbulb,
  Mail,
  ShieldCheck,
  CircleAlert,
  RotateCw,
  PencilLine,
} from "lucide-react";
import { AlertInfo } from "../TravelRequisitionPage";
import SubmittingOverlay from "../SubmittingOverlay";
import AlertModal from "../AlertModal";
import { useToggleStore } from "@/store/useToggleStore";
import SalaryAdvanceConfirmationModal from "./SalaryAdvanceConfirmationModal";
import Image from "next/image";
import { assets } from "@/public/assets";
import { DropdownOption } from "./CustomDropDown";
import CustomDropdown from "./CustomDropDown";
import { RequestVerificationCode } from "@/serverActions/PublicServerActions/RequestVerificationCode";
import { VerifyAdvanceCode } from "@/serverActions/PublicServerActions/VerifyAdvanceCode";
import { GetAdvanceFormSession } from "@/serverActions/GetAdvanceFormSession";
import { SubmitAdvanceForm } from "@/serverActions/PublicServerActions/SubmitAdvanceForm";
import SalaryAdvanceFormSkeleton from "../Skeletons/SalaryAdvanceFormSkeleton";

export interface SalaryAdvanceFormData {
  staffNumber: string;
  staffName: string;
  staffEmail: string;
  department: string;
  location: string;
  requestAmount: string;
  installments: string;
  repaymentStartDate: string;
  requestType: string;
}

const InitialFormState: SalaryAdvanceFormData = {
  staffNumber: "",
  staffName: "",
  staffEmail: "",
  department: "",
  location: "",
  requestAmount: "",
  installments: "",
  repaymentStartDate: "",
  requestType: "",
};

// Define these arrays
const INSTALLMENT_OPTIONS: DropdownOption[] = [
  { label: "One", value: "1" },
  { label: "Two", value: "2" },
  { label: "Three", value: "3" },
];

const REQUEST_TYPE_OPTIONS: DropdownOption[] = [
  { label: "One-off", value: "oneoff" },
  { label: "Continuous", value: "continuous" },
];

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;
const CODE_SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const VERIFICATION_STEPS = [
  {
    title: "Verify your email",
    detail: "We send a 6-digit code to the address on your staff record.",
  },
  {
    title: "Complete the form",
    detail: "Your staff details are filled in for you once verified.",
  },
  {
    title: "HR & Finance review",
    detail: "You'll be notified by email as your request is processed.",
  },
];

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function applyStaffSession(
  staff: {
    staffNumber: string;
    staffName: string;
    staffEmail: string;
    department: string;
    location: string;
  },
  updateField: <K extends keyof SalaryAdvanceFormData>(
    field: K,
    value: SalaryAdvanceFormData[K],
  ) => void,
) {
  updateField("staffNumber", staff.staffNumber);
  updateField("staffName", staff.staffName);
  updateField("staffEmail", staff.staffEmail);
  updateField("department", staff.department);
  updateField("location", staff.location);
}

function StaffInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex h-10 w-full cursor-not-allowed items-center rounded-xl border border-[rgba(240,180,180,0.6)] bg-gray-100 px-3.5 text-sm text-slate-700 select-none">
        {value}
      </div>
    </div>
  );
}

export default function SalaryAdvanceClient() {
  const triggerScroll = useToggleStore((state) => state.triggerScroll);
  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);

  const [step, setStep] = useState(1);
  const [checkingSession, setCheckingSession] = useState(true);
  const [verifyStage, setVerifyStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [formData, setFormData] =
    useState<SalaryAdvanceFormData>(InitialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });

  const codeInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  // Tracks the last complete code we auto-submitted, so a failed attempt
  // isn't retried on every render.
  const autoSubmittedCodeRef = useRef("");
  // Mirrors `code` synchronously (state updates apply on next render), so
  // handlers that fire focus events right after setCode see the current
  // value instead of a stale closure.
  const codeRef = useRef("");

  const updateCode = (next: string) => {
    codeRef.current = next;
    setCode(next);
  };

  // Repayment must start on the 15th of the submission month (processing
  // date), up to the 1st of the month following the one the form is
  // submitted in.
  const { repaymentMinDate, repaymentMaxDate } = useMemo(() => {
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth(), 15);
    const max = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      repaymentMinDate: toISODate(min),
      repaymentMaxDate: toISODate(max),
    };
  }, []);

  const updateField = <K extends keyof SalaryAdvanceFormData>(
    field: K,
    value: SalaryAdvanceFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Continuous requests are always repaid in a single installment, so the
  // installments field is locked to "1" and hidden as soon as this is chosen;
  // switching back to one-off clears it so the user picks explicitly again.
  const handleRequestTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      requestType: value,
      installments: value === "continuous" ? "1" : "",
    }));
  };

  // On mount, check whether the user already has a valid verified form session,
  // so they don't have to re-verify their email if they refresh mid-form.
  useEffect(() => {
    (async () => {
      const session = await GetAdvanceFormSession();
      if (session) {
        applyStaffSession(session, updateField);
        setStep(2);
      }
      setCheckingSession(false);
    })();
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setResendSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  // Listen for the Zustand trigger change
  useEffect(() => {
    const executeScroll = () => {
      requestAnimationFrame(() => {
        // Find all elements with the specific class
        const scrollableElements =
          document.querySelectorAll(".layout-scrollbar");

        // Scroll each one to the top
        scrollableElements.forEach((element) => {
          element.scrollTo({ top: 0, behavior: "instant" });
        });
      });
    };

    executeScroll();
  }, [scrollTrigger]);

  const requiredFields: (keyof SalaryAdvanceFormData)[] = [
    "staffNumber",
    "staffName",
    "staffEmail",
    "department",
    "location",
    "requestAmount",
    "installments",
    "repaymentStartDate",
    "requestType",
  ];
  const isFormValid =
    requiredFields.every((field) => formData[field]) && policyAccepted;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerifyError("");

    try {
      const response = await RequestVerificationCode(email);

      if (response.type === "error") throw new Error(response.message);

      updateCode("");
      autoSubmittedCodeRef.current = "";
      setVerifyStage("code");
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error instanceof Error) setVerifyError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendSecondsLeft > 0 || submitting) return;
    setSubmitting(true);
    setVerifyError("");

    try {
      const response = await RequestVerificationCode(email);
      if (response.type === "error") throw new Error(response.message);
      updateCode("");
      autoSubmittedCodeRef.current = "";
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      focusCodeInput(0);
    } catch (error) {
      if (error instanceof Error) setVerifyError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (submittedCode: string) => {
    if (submitting) return;
    setSubmitting(true);
    setVerifyError("");

    try {
      const response = await VerifyAdvanceCode(email, submittedCode);

      if (response.type === "error") throw new Error(response.message);

      if (response.staff) {
        applyStaffSession(response.staff, updateField);
      }

      setStep(2);
    } catch (error) {
      if (error instanceof Error) setVerifyError(error.message);
      // Clear the boxes so the next attempt starts from a clean slate.
      updateCode("");
      autoSubmittedCodeRef.current = "";
      codeInputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < CODE_LENGTH) return;
    autoSubmittedCodeRef.current = code;
    verifyCode(code);
  };

  const focusCodeInput = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), CODE_LENGTH - 1);
    const target = codeInputsRef.current[clamped];
    target?.focus();
    target?.select();
  };

  // The code is always filled left to right, so it never has gaps — clicking
  // ahead of the next empty box just lands on that box instead. Reads from
  // codeRef (not the `code` state) because this can fire synchronously right
  // after updateCode(), before the component has re-rendered with the new
  // value.
  const handleDigitFocus = (index: number) => {
    if (index > codeRef.current.length) focusCodeInput(codeRef.current.length);
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      updateCode(
        codeRef.current.slice(0, index) + codeRef.current.slice(index + 1),
      );
      return;
    }

    updateCode(
      (
        codeRef.current.slice(0, index) +
        digits +
        codeRef.current.slice(index + digits.length)
      ).slice(0, CODE_LENGTH),
    );

    focusCodeInput(index + digits.length);
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      e.preventDefault();
      updateCode(
        codeRef.current.slice(0, index - 1) + codeRef.current.slice(index),
      );
      focusCodeInput(index - 1);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCodeInput(index - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCodeInput(index + 1);
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!digits) return;
    e.preventDefault();
    updateCode(digits);
    focusCodeInput(digits.length);
  };

  // Submit as soon as the last digit lands — typing or pasting.
  useEffect(() => {
    if (step !== 1 || verifyStage !== "code") return;
    if (code.length !== CODE_LENGTH) return;
    if (autoSubmittedCodeRef.current === code) return;
    autoSubmittedCodeRef.current = code;
    verifyCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step, verifyStage]);

  // Drop the caret into the first box when the code stage opens.
  useEffect(() => {
    if (step !== 1 || verifyStage !== "code") return;
    codeInputsRef.current[0]?.focus();
  }, [step, verifyStage]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await SubmitAdvanceForm(formData);

      setAlertInfo({
        alertType: response.type,
        alertMessage: response.message,
      });

      if (response.type === "success") {
        setFormData(InitialFormState);
      }

      setStep(4);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while trying to submit a salary advance:", error);
        setAlertInfo({ alertType: "error", alertMessage: error.toString() });
        setStep(4);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex-1 p-4">
      {submitting && <SubmittingOverlay />}
      {step === 4 && (
        <AlertModal
          alertInfo={alertInfo}
          onBack={() => setStep(2)}
          hideButton={true}
        />
      )}

      {step === 3 && (
        <SalaryAdvanceConfirmationModal
          formData={formData}
          onBack={() => {
            setStep(2);
            triggerScroll(!scrollTrigger);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* STEP 1: Email + Code Verification */}
      {step === 1 && checkingSession && <SalaryAdvanceFormSkeleton />}

      {step === 1 && !checkingSession && (
        <div className="animate-rise mx-auto flex min-h-[70vh] w-full max-w-5xl items-center py-6 sm:py-10">
          <div className="w-full">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
              {/* ── Context panel ── */}
              <div className="order-2 lg:order-1">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/70 py-1.5 pr-4 pl-1.5 text-[10px] font-bold tracking-wide text-rose-700 uppercase shadow-sm backdrop-blur-sm sm:text-[11px]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white">
                    <ShieldCheck size={11} />
                  </span>
                  Secure verification
                </div>

                <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl sm:leading-[1.1]">
                  Salary Advance <span className="text-rose-700">Request</span>
                </h1>

                <p className="mb-7 max-w-md text-[15px] leading-relaxed text-slate-500">
                  Before you fill in the form, we need to confirm it&apos;s
                  really you. Verification uses the personal email address HR
                  registered during your onboarding.
                </p>

                <ol className="mb-7 flex flex-col gap-4">
                  {VERIFICATION_STEPS.map((item, index) => (
                    <li key={item.title} className="flex items-start gap-3.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${
                          index === 0
                            ? "bg-rose-600 text-white ring-rose-300"
                            : "bg-white/80 text-slate-400 ring-slate-200"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-[12.5px] leading-relaxed text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="flex max-w-md items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-amber-900 backdrop-blur-sm">
                  <Lightbulb size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Verification requires access to that mailbox. If you no
                    longer have access to it, contact HR to update your records
                    before requesting a salary advance.
                  </p>
                </div>
              </div>

              {/* ── Verification card ── */}
              <div className="relative order-1 lg:order-2">
                <div className="pointer-events-none absolute -inset-2 rounded-[2.5rem] bg-rose-100/40 blur-xl" />

                <div className="relative rounded-4xl border border-white/80 bg-white/85 p-6 shadow-[0_2px_4px_rgba(140,40,60,0.03),0_24px_48px_-20px_rgba(140,40,60,0.28)] backdrop-blur-xl sm:p-8">
                  {/* Stage progress */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex flex-1 gap-1.5">
                      <span className="h-1 flex-1 rounded-full bg-rose-600" />
                      <span
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          verifyStage === "code"
                            ? "bg-rose-600"
                            : "bg-slate-200"
                        }`}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                      Step {verifyStage === "code" ? 2 : 1} of 2
                    </span>
                  </div>

                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-300/60">
                    {verifyStage === "code" ? (
                      <ShieldCheck size={22} />
                    ) : (
                      <Mail size={22} />
                    )}
                  </div>

                  {verifyStage === "email" ? (
                    <>
                      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
                        Verify your identity
                      </h2>
                      <p className="mb-6 text-sm leading-relaxed text-slate-500">
                        Enter the email address registered by HR during your
                        onboarding and we&apos;ll send you a 6-digit code.
                      </p>

                      {verifyError && (
                        <div
                          role="alert"
                          className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-rose-700"
                        >
                          <CircleAlert size={16} className="mt-0.5 shrink-0" />
                          <p className="text-[13px] leading-relaxed">
                            {verifyError}
                          </p>
                        </div>
                      )}

                      <form
                        onSubmit={handleRequestCode}
                        className="flex flex-col gap-5"
                      >
                        <div>
                          <label
                            htmlFor="advance-email"
                            className="mb-2 block text-[13px] font-medium text-slate-600"
                          >
                            Email address{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail
                              size={18}
                              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              id="advance-email"
                              type="email"
                              required
                              autoFocus
                              autoComplete="email"
                              className="h-13 w-full rounded-2xl border border-slate-200 bg-white/80 pr-4 pl-11 text-sm text-slate-900 transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.12)]"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-400">
                            <Lightbulb size={13} className="mt-0.5 shrink-0" />
                            This is likely the address where you receive your
                            payslips.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                        >
                          {submitting ? "Sending code..." : "Send my code"}
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
                        Enter your code
                      </h2>
                      <p className="mb-6 text-sm leading-relaxed text-slate-500">
                        If{" "}
                        <span className="font-semibold text-slate-800">
                          {email}
                        </span>{" "}
                        is in our records, a 6-digit code is on its way. It
                        expires in 10 minutes.
                      </p>

                      {verifyError && (
                        <div
                          role="alert"
                          className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-rose-700"
                        >
                          <CircleAlert size={16} className="mt-0.5 shrink-0" />
                          <p className="text-[13px] leading-relaxed">
                            {verifyError}
                          </p>
                        </div>
                      )}

                      <form
                        onSubmit={handleVerifyCode}
                        className="flex flex-col gap-5"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          {CODE_SLOTS.map((slot) => (
                            <input
                              key={slot}
                              ref={(el) => {
                                codeInputsRef.current[slot] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              autoComplete={
                                slot === 0 ? "one-time-code" : "off"
                              }
                              maxLength={1}
                              aria-label={`Verification code digit ${slot + 1}`}
                              value={code[slot] ?? ""}
                              onChange={(e) =>
                                handleDigitChange(slot, e.target.value)
                              }
                              onKeyDown={(e) => handleDigitKeyDown(slot, e)}
                              onFocus={() => handleDigitFocus(slot)}
                              onPaste={handleCodePaste}
                              className={`h-14 w-full min-w-0 rounded-2xl border bg-white/80 text-center text-xl font-semibold text-slate-900 transition-all duration-200 outline-none focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.12)] ${
                                code[slot]
                                  ? "border-rose-300"
                                  : "border-slate-200"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={submitting || code.length < CODE_LENGTH}
                          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                        >
                          {submitting ? "Verifying..." : "Verify & proceed"}
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </form>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyStage("email");
                            updateCode("");
                            autoSubmittedCodeRef.current = "";
                            setVerifyError("");
                          }}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        >
                          <PencilLine size={13} />
                          Change email
                        </button>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendSecondsLeft > 0 || submitting}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                        >
                          <RotateCw size={13} />
                          {resendSecondsLeft > 0
                            ? `Resend in ${resendSecondsLeft}s`
                            : "Resend code"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-slate-400">
              Having trouble? Contact the HR Department for assistance.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Main Form */}
      {step === 2 && (
        <div className="relative z-10 mx-auto max-w-225">
          {/* Form Image */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.advance_form_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center"
              priority
              alt="Form Image"
            />
          </div>
          <header className="mb-8">
            <h1 className="m-0 text-2xl font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Salary Advance Request
            </h1>
            <p className="mt-1 text-[14px] text-[#7c5a5a]">
              Enter your salary advance details below.
            </p>
          </header>

          <div className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
            <form
              className="flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(3);
                triggerScroll(!scrollTrigger);
              }}
            >
              {/* Employee Information */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <UserRound size={16} /> Staff Information
                </h2>
                <p className="mb-4 text-xs text-slate-500">
                  These details were verified against your staff record and
                  can&apos;t be edited here. Contact HR if anything is
                  incorrect.
                </p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <StaffInfoField
                    label="Staff Number"
                    value={formData.staffNumber}
                  />
                  <StaffInfoField
                    label="Staff Name"
                    value={formData.staffName}
                  />
                  <StaffInfoField
                    label="Staff Email"
                    value={formData.staffEmail}
                  />
                  <StaffInfoField
                    label="Department"
                    value={formData.department}
                  />
                  <StaffInfoField label="Location" value={formData.location} />
                </div>
              </div>

              <hr className="border-[rgba(240,180,180,0.6)]" />

              {/* Advance Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <CircleDollarSign size={16} /> Advance Details
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Request Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      value={formData.requestAmount}
                      onChange={(e) =>
                        updateField("requestAmount", e.target.value)
                      }
                    />
                  </div>

                  {/* Request Type Dropdown */}
                  <CustomDropdown
                    label="Request Type"
                    options={REQUEST_TYPE_OPTIONS}
                    value={formData.requestType}
                    onChange={handleRequestTypeChange}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Repayment Start Date{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.repaymentStartDate}
                      onChange={(v) => updateField("repaymentStartDate", v)}
                      minDate={repaymentMinDate}
                      maxDate={repaymentMaxDate}
                    />
                  </div>

                  {/* Installments: only shown once a request type is chosen;
                      continuous requests skip straight to a locked-at-one note. */}
                  {formData.requestType === "continuous" ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-medium text-[#7c5a5a]">
                        No. of Installments
                      </label>
                      <div className="flex h-10 items-center rounded-xl border border-[rgba(240,180,180,0.6)] bg-gray-100 px-3.5 text-[13px] text-slate-600">
                        Continuous requests are repaid in a single installment.
                      </div>
                    </div>
                  ) : (
                    formData.requestType === "oneoff" && (
                      <CustomDropdown
                        label="No. of Installments"
                        options={INSTALLMENT_OPTIONS}
                        value={formData.installments}
                        onChange={(val) => updateField("installments", val)}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Policy & Disclaimer */}
              <div className="mt-4 rounded-2xl bg-red-50/30 p-6 text-sm text-slate-700 shadow-inner">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <FileText size={18} /> Salary Advance Policy Guidelines
                </h4>
                <p className="mb-3">
                  To ensure efficient financial management and compliance, all
                  requests for salary advances will be required to adhere to the
                  following guidelines:
                </p>
                <ul className="mb-5 list-inside list-disc space-y-1.5 pl-2 text-[13px]">
                  <li>
                    <strong>Processing Schedule:</strong> Salary advance
                    requests will be processed once per month, specifically by
                    the 15th of each month.
                  </li>
                  <li>
                    <strong>Submission Deadline:</strong> All requests must be
                    submitted through the system no later than the 10th of every
                    month - latest by 5.00pm
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> All salary advances must
                    be processed in strict alignment with the one-third (1/3)
                    rule.
                  </li>
                  <li>
                    <strong>Exception:</strong> Any salary advance requests
                    received outside of the stipulated submission deadlines will
                    not be processed, except in the case of a documented,
                    verified emergency.
                  </li>
                  <li>
                    <strong>Repayment Terms:</strong> The maximum repayment
                    period for any salary advance is three(3) months, also
                    subject to the strict adherence of the one-third (1/3) rule.
                  </li>
                  <li>
                    <strong>Limitation:</strong> Multiple salary advances are
                    strictly not allowed.
                  </li>
                </ul>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-all hover:bg-red-50">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${policyAccepted ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 bg-white"}`}
                  >
                    {policyAccepted && (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                  />
                  <span className="text-[13px] leading-tight font-medium">
                    I hereby acknowledge that I have read and fully understood
                    the Salary Advance Policy and agree to comply with all
                    provisions contained therein.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proceed to Confirmation
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
