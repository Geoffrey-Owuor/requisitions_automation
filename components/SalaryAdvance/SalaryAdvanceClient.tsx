"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "../DatePicker";
import {
  ArrowRight,
  FileText,
  Check,
  UserRound,
  CircleDollarSign,
} from "lucide-react";
import { AlertInfo } from "../TravelRequisitionPage";
import SubmittingOverlay from "../SubmittingOverlay";
import AlertModal from "../AlertModal";
import { usePathname } from "next/navigation";
import { useToggleStore } from "@/store/useToggleStore";
import SalaryAdvanceConfirmationModal from "./SalaryAdvanceConfirmationModal";
import Image from "next/image";
import { assets } from "@/public/assets";
import { DropdownOption } from "./CustomDropDown";
import CustomDropdown from "./CustomDropDown";
import { GetOtp } from "@/serverActions/PublicServerActions/GetOtp";
import { FetchStaffDetails } from "@/serverActions/PublicServerActions/FetchStaffDetails";
import { SubmitAdvanceForm } from "@/serverActions/PublicServerActions/SubmitAdvanceForm";

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

export default function SalaryAdvanceClient() {
  const pathname = usePathname();
  const triggerScroll = useToggleStore((state) => state.triggerScroll);
  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);

  const [step, setStep] = useState(pathname === "/advance" ? 1 : 2);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] =
    useState<SalaryAdvanceFormData>(InitialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [staffSearchStatus, setStaffSearchStatus] = useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });

  // OTP Error
  const [otpError, setOtpError] = useState("");

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

  const updateField = <K extends keyof SalaryAdvanceFormData>(
    field: K,
    value: SalaryAdvanceFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Replace handleStaffNumberBlur with this useEffect
  useEffect(() => {
    // 1. Don't fetch if empty
    if (!formData.staffNumber?.trim()) {
      return;
    }

    // 2. Set up the debounce timer (e.g., 500ms delay)
    const timer = setTimeout(async () => {
      setStaffSearchStatus("loading");

      try {
        const staffData = await FetchStaffDetails(formData.staffNumber);

        if (staffData) {
          updateField("staffName", staffData.staff_name);
          updateField("staffEmail", staffData.staff_email);
          updateField("department", staffData.staff_department);
          updateField("location", staffData.staff_location);
          setStaffSearchStatus("found");
        } else {
          setStaffSearchStatus("not_found");
          // Clear fields for manual entry
          updateField("staffName", "");
          updateField("staffEmail", "");
          updateField("department", "");
          updateField("location", "");
        }
      } catch {
        setStaffSearchStatus("not_found");
      }
    }, 500); // 500ms after user stops typing

    // 3. Cleanup: cancel the timer if the user types again before 500ms
    return () => clearTimeout(timer);
  }, [formData.staffNumber]); // Re-run effect whenever staffNumber changes

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await GetOtp(otp);

      if (response.type === "error") throw new Error(response.message);

      setOtpError("");
      setStep(2);
    } catch (error) {
      if (error instanceof Error) {
        setOtpError(error.toString());
      }
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
        <AlertModal alertInfo={alertInfo} onBack={() => setStep(2)} />
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

      {/* STEP 1: OTP Entry */}
      {step === 1 && (
        <div className="flex h-full flex-col items-center justify-center">
          {/* Main Centered Content */}
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/85 bg-white/65 p-8 shadow-xl backdrop-blur-2xl">
              <h2 className="mb-4 text-xl font-semibold">
                Security Verification
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                Please enter the Salary Advance password to access the request
                form.
              </p>

              {/* OTP Error */}
              {otpError && (
                <p className="mb-6 text-sm text-red-600">{otpError}</p>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <input
                  type="text"
                  required
                  className="h-12 rounded-xl border border-slate-300 px-4 text-center tracking-widest outline-none focus:border-rose-500"
                  placeholder="Enter Password"
                  value={otp}
                  maxLength={10}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {submitting ? "Verifying..." : "Verify & Proceed"}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-auto py-6 text-center text-sm font-medium text-slate-500">
            <p>
              For assistance with the password, please contact the HR
              Department.
            </p>
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Staff Number <span className="mr-3 text-red-500">*</span>
                      {staffSearchStatus === "not_found" && (
                        <span className="text-xs text-amber-700">
                          Staff info not found. Contact hr for inquiry.
                        </span>
                      )}
                      {staffSearchStatus === "loading" && (
                        <span className="animate-pulse text-xs text-neutral-700">
                          Fetching staff info...
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      value={formData.staffNumber}
                      onChange={(e) =>
                        updateField("staffNumber", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Staff Name <span className="text-red-500">*</span>
                    </label>

                    {/* Wrapper for the input and tooltip */}
                    <div className="group relative w-full">
                      {/* Conditional Tooltip */}
                      {!formData.staffNumber && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-slate-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          Fill in staff number first
                          <div className="absolute -bottom-1 left-17 h-2.5 w-2.5 rotate-45 rounded-sm bg-slate-800" />
                        </div>
                      )}

                      <input
                        type="text"
                        required
                        disabled
                        className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)] disabled:cursor-not-allowed disabled:bg-gray-100"
                        value={formData.staffName}
                        onChange={(e) =>
                          updateField("staffName", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Staff Email <span className="text-red-500">*</span>
                    </label>

                    {/* Wrapper for the input and tooltip */}
                    <div className="group relative w-full">
                      {/* Conditional Tooltip */}
                      {!formData.staffNumber && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-slate-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          Fill in staff number first
                          <div className="absolute -bottom-1 left-17 h-2.5 w-2.5 rotate-45 rounded-sm bg-slate-800" />
                        </div>
                      )}
                      <input
                        type="email"
                        required
                        disabled
                        className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)] disabled:cursor-not-allowed disabled:bg-gray-100"
                        value={formData.staffEmail}
                        onChange={(e) =>
                          updateField("staffEmail", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Department <span className="text-red-500">*</span>
                    </label>

                    {/* Wrapper for the input and tooltip */}
                    <div className="group relative w-full">
                      {/* Conditional Tooltip */}
                      {!formData.staffNumber && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-slate-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          Fill in staff number first
                          <div className="absolute -bottom-1 left-17 h-2.5 w-2.5 rotate-45 rounded-sm bg-slate-800" />
                        </div>
                      )}
                      <input
                        type="text"
                        required
                        disabled
                        className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)] disabled:cursor-not-allowed disabled:bg-gray-100"
                        value={formData.department}
                        onChange={(e) =>
                          updateField("department", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Location <span className="text-red-500">*</span>
                    </label>

                    {/* Wrapper for the input and tooltip */}
                    <div className="group relative w-full">
                      {/* Conditional Tooltip */}
                      {!formData.staffNumber && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-slate-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          Fill in staff number first
                          <div className="absolute -bottom-1 left-17 h-2.5 w-2.5 rotate-45 rounded-sm bg-slate-800" />
                        </div>
                      )}
                      <input
                        type="text"
                        required
                        disabled
                        className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)] disabled:cursor-not-allowed disabled:bg-gray-100"
                        value={formData.location}
                        onChange={(e) =>
                          updateField("location", e.target.value)
                        }
                      />
                    </div>
                  </div>
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
                    submitted in writing to the HR Department no later than the
                    10th of every month.
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
