"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "../DatePicker";
import {
  ArrowRight,
  FileText,
  Check,
  UserRound,
  CircleDollarSign,
  Lightbulb,
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
  requestType: "oneoff",
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
      <div className="flex h-10 w-full items-center rounded-xl border border-[rgba(240,180,180,0.6)] bg-gray-100 px-3.5 text-sm text-slate-700 select-none">
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

  const updateField = <K extends keyof SalaryAdvanceFormData>(
    field: K,
    value: SalaryAdvanceFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error instanceof Error) setVerifyError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerifyError("");

    try {
      const response = await VerifyAdvanceCode(email, code);

      if (response.type === "error") throw new Error(response.message);

      if (response.staff) {
        applyStaffSession(response.staff, updateField);
      }

      setStep(2);
    } catch (error) {
      if (error instanceof Error) setVerifyError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex h-full flex-col items-center justify-center">
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-115 rounded-3xl p-8">
              {verifyStage === "email" ? (
                <>
                  <h2 className="mb-4 text-center text-2xl font-semibold">
                    Verify Your Identity
                  </h2>
                  <p className="mb-4 text-sm text-slate-600">
                    Enter the email address your staff details were
                    registered/onboarded with (The personal email you used).
                    We&apos;ll send a verification code to confirm it&apos;s
                    you.
                  </p>
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs">
                    <Lightbulb className="h-4 w-4 shrink-0" />
                    This is likely the email address where you receive your
                    payslips
                  </span>
                  <p className="mb-6 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    If this isn&apos;t the email currently on file for you,
                    verification will fail. If you no longer have access to that
                    email, contact HR to update your records before proceeding
                    with your salary advance request.
                  </p>

                  {verifyError && (
                    <p className="mb-6 text-sm text-red-600">{verifyError}</p>
                  )}

                  <form
                    onSubmit={handleRequestCode}
                    className="flex flex-col gap-4"
                  >
                    <input
                      type="email"
                      required
                      className="h-12 rounded-full border border-slate-300 px-4 text-center outline-none focus:border-rose-500"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 rounded-full bg-slate-900 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Send Verification Code"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="mb-4 text-2xl font-semibold">
                    Enter Verification Code
                  </h2>
                  <p className="mb-6 text-sm text-slate-600">
                    If <strong>{email}</strong> is on our records, a 6-digit
                    code has been sent to it. The code expires in 10 minutes.
                  </p>

                  {verifyError && (
                    <p className="mb-6 text-sm text-red-600">{verifyError}</p>
                  )}

                  <form
                    onSubmit={handleVerifyCode}
                    className="flex flex-col gap-4"
                  >
                    <input
                      type="text"
                      required
                      className="h-12 rounded-full border border-slate-300 px-4 text-center tracking-widest outline-none focus:border-rose-500"
                      placeholder="Enter Code"
                      value={code}
                      maxLength={6}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 rounded-full bg-slate-900 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                    >
                      {submitting ? "Verifying..." : "Verify & Proceed"}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyStage("email");
                        setCode("");
                        setVerifyError("");
                      }}
                      className="cursor-pointer underline"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendSecondsLeft > 0 || submitting}
                      className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendSecondsLeft > 0
                        ? `Resend code (${resendSecondsLeft}s)`
                        : "Resend code"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-auto py-6 text-center text-sm font-medium text-slate-500">
            <p>For assistance, please contact the HR Department.</p>
          </footer>
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
              Submit your salary advance details below.
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
                      className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      value={formData.requestAmount}
                      onChange={(e) =>
                        updateField("requestAmount", e.target.value)
                      }
                    />
                  </div>

                  {/* Installments DropDown */}
                  <CustomDropdown
                    label="No. of Installments"
                    options={INSTALLMENT_OPTIONS}
                    value={formData.installments}
                    onChange={(val) => updateField("installments", val)}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Repayment Start Date{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.repaymentStartDate}
                      onChange={(v) => updateField("repaymentStartDate", v)}
                    />
                  </div>

                  {/* Request Type Dropdown */}
                  <CustomDropdown
                    label="Request Type"
                    options={REQUEST_TYPE_OPTIONS}
                    value={formData.requestType}
                    onChange={(val) => updateField("requestType", val)}
                  />
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
