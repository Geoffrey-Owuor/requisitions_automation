"use client";

import { useUser } from "@/context/UserContext";
import { useState, ChangeEvent } from "react";
import { DatePicker } from "@/components/DatePicker";
import {
  UserRound,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Check,
} from "lucide-react";
import Image from "next/image";
import { assets } from "@/public/assets";
import { useQuery } from "@tanstack/react-query";
import { loadHodApprovers, loadBaseDepartments } from "@/lib/loadAppDataV2";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import AlertModal from "@/components/AlertModal";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import KeyConfirmationModal from "./KeyConfirmationModal";
import { useToggleStore } from "@/store/useToggleStore";
import { FormSelect } from "./CasualRequisitionForm";

// ---- Types ----
export interface KeyAccessFormData {
  employeeName: string;
  staffNumber: string;
  department: string;
  hodApprover: string;
  issuanceDate: string;
  requirements: string;
  locations: string;
}

const InitialFormState: KeyAccessFormData = {
  employeeName: "",
  staffNumber: "",
  department: "",
  hodApprover: "",
  issuanceDate: "",
  requirements: "",
  locations: "",
};

// ---- Sub-component prop types ----
interface FormInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

// ---- Main Page ----
export default function KeyAccessRequisitionForm() {
  const { username, email } = useUser();

  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);
  const triggerScroll = useToggleStore((state) => state.triggerScroll);

  // Load departments
  const { data: DEPARTMENTS = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["BaseDepartmentsData"],
    queryFn: loadBaseDepartments,
  });

  // Load HODS
  const { data: HOD_APPROVERS = [], isLoading: hodsLoading } = useQuery({
    queryKey: ["BaseHodApproversData"],
    queryFn: loadHodApprovers,
  });

  const [formData, setFormData] = useState<KeyAccessFormData>(InitialFormState);
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Required fields for button disable check
  const requiredFields: (keyof KeyAccessFormData)[] = [
    "employeeName",
    "staffNumber",
    "department",
    "hodApprover",
    "issuanceDate",
    "requirements",
    "locations",
  ];

  // Button is disabled if any required field is empty OR if terms aren't agreed to
  const buttonDisabled =
    requiredFields.some((field) => !formData[field]) || !agreedToTerms;

  const updateField = <K extends keyof KeyAccessFormData>(
    field: K,
    value: KeyAccessFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      formData,
      submittedBy: {
        name: username,
        email: email,
      },
    };

    setSubmitting(true);

    try {
      // TODO: Update the API endpoint to your actual Key Requisition endpoint
      const response = await ApiHandler(
        "/api/accessrequisition/submitrequisition",
        "POST",
        payload,
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message ||
            "An error occurred while trying to submit your Key Access requisition",
        );

      setAlertInfo({
        alertType: "success",
        alertMessage:
          data.message ||
          "Your Key Access requisition has been submitted successfully.",
      });

      setFormData(InitialFormState);
      setAgreedToTerms(false);
      setStep(3);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error while trying to submit Key Access requisition",
          error,
        );
        setAlertInfo({ alertType: "error", alertMessage: error.toString() });
        setStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative p-2">
      {submitting && <SubmittingOverlay />}

      {step === 3 && (
        <AlertModal alertInfo={alertInfo} onBack={() => setStep(1)} />
      )}

      {step === 2 && (
        <KeyConfirmationModal
          formData={formData}
          onBack={() => {
            setStep(1);
            triggerScroll(!scrollTrigger);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {step === 1 && (
        <div className="relative z-10 mx-auto max-w-225">
          {/* Form Image - TODO: Update src to appropriate asset if needed */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.access_key_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center"
              priority
              alt="Form Image"
            />
          </div>

          {/* Header */}
          <header className="mb-8 flex items-end justify-between max-sm:flex-col max-sm:items-start max-sm:gap-5">
            <div>
              <h1 className="m-0 text-2xl font-semibold tracking-[-0.5px] text-[#1e1b1b]">
                Key & Access Requisition
              </h1>
              <p className="mt-1 text-[14px] text-[#7c5a5a]">
                Submit your request for facility keys and access codes.
              </p>
            </div>
          </header>

          {/* Form Card */}
          <div className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
            <form
              className="flex flex-col gap-10"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
                triggerScroll(!scrollTrigger);
              }}
            >
              {/* Section 1: Staff Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <UserRound size={16} /> Staff Information
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <FormInput
                    label="Employee Name"
                    placeholder="Full Name"
                    value={formData.employeeName}
                    onChange={(v) => updateField("employeeName", v)}
                  />
                  <FormInput
                    label="Staff Number"
                    placeholder="Employee staff number"
                    value={formData.staffNumber}
                    onChange={(v) => updateField("staffNumber", v)}
                  />
                  <FormSelect
                    label="Department"
                    options={DEPARTMENTS}
                    value={formData.department}
                    loading={departmentsLoading}
                    onChange={(v) => updateField("department", v)}
                  />
                  <FormSelect
                    label="HOD Approver"
                    options={HOD_APPROVERS}
                    value={formData.hodApprover}
                    loading={hodsLoading}
                    onChange={(v) => updateField("hodApprover", v)}
                  />

                  {/* Issuance Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Issuance Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.issuanceDate}
                      onChange={(v) => updateField("issuanceDate", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Access Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <MapPin size={16} /> Access Details
                </h2>

                <div className="flex flex-col gap-6">
                  {/* Locations Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Locations to be Accessed{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="h-24 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      placeholder="Specify the exact rooms, stores, or facilities you need access to..."
                      value={formData.locations}
                      required
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("locations", e.target.value)
                      }
                    />
                  </div>

                  {/* Requirements Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Requirements / Justification{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="h-24 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      placeholder="State the requirements and the reason why access to these locations is required..."
                      value={formData.requirements}
                      required
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("requirements", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Disclaimers & Acknowledgement */}
              <div className="mt-2">
                <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <ShieldAlert size={16} /> Key Custody & Access Policy
                </h2>

                <div className="small-scrollbar mb-4 max-h-60 overflow-y-auto rounded-xl border border-[rgba(240,180,180,0.6)] bg-rose-50/30 p-4 text-[13px] leading-relaxed text-[#5c4a4a]">
                  <p className="mb-3 font-semibold text-[#1e1b1b]">
                    By receiving these keys/access codes, you are bound by the
                    following conditions:
                  </p>
                  <ol className="ml-4 flex list-decimal flex-col gap-1.5 pb-3">
                    <li>
                      Safeguard the store and key(s) securely at all times.
                    </li>
                    <li>Use the key(s) strictly for official purposes only.</li>
                    <li>
                      Arm and disarm the premises during departure and entry
                      respectively.
                    </li>
                    <li>
                      Ensure all staff and visitors have exited the premises,
                      all windows and access points are closed, and lights
                      switched off before arming the system.
                    </li>
                    <li>
                      Report any lost, damaged, or missing key(s) to HOD & HAL
                      Security immediately.
                    </li>
                    <li>
                      Do not attempt to copy, alter, duplicate, or reproduce any
                      HAL facility key(s).
                    </li>
                    <li>
                      Do not share your access code with any colleague,
                      stranger, or unauthorized person.
                    </li>
                    <li>
                      If unable to secure the premises, report immediately to
                      the HOD & HAL Security Department.
                    </li>
                    <li>
                      Produce or surrender the key(s) upon official request or
                      before proceeding on leave.
                    </li>
                    <li>
                      Report any absence or unfamiliar security guard within the
                      facility before opening the premises.
                    </li>
                    <li>
                      Open & close the premises only in the presence of familiar
                      contracted security personnel.
                    </li>
                    <li>
                      Report and respond appropriately to any emergencies
                      brought to your attention.
                    </li>
                    <li>
                      Change your access code whenever deemed necessary based on
                      your judgment or security concerns.
                    </li>
                  </ol>
                  <p className="mt-2 font-semibold text-rose-700">
                    Do not hand over the key(s) to strangers or unauthorized
                    persons under any circumstances.
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-2 transition-all hover:bg-rose-50/50">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${agreedToTerms ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 bg-white"}`}
                  >
                    {agreedToTerms && (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="text-[13px] leading-tight font-medium text-slate-700">
                    I agree to comply with all HAL policies and procedures
                    relating to the custody and use of facility/store key(s) and
                    access codes. I further acknowledge that if the key(s) are
                    lost, stolen, damaged, or not surrendered upon request, I
                    may be surcharged for costs incurred, including replacement
                    of locks and related security measures.
                  </span>{" "}
                </label>
              </div>

              {/* Submit Button */}
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={buttonDisabled}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Proceed to Review
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-center text-xs text-[#7c5a5a]">
                  All fields and policy agreement are required to proceed.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper Components ----

function FormInput({ label, placeholder, value, onChange }: FormInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        required
      />
    </div>
  );
}
