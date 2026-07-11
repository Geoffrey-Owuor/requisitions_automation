"use client";

import { useUser } from "@/context/UserContext";
import { useState, ChangeEvent } from "react";
import { DatePicker } from "../DatePicker";
import {
  ChevronDown,
  UserRound,
  ArrowRight,
  CheckSquare,
  Check,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";
import { assets } from "@/public/assets";
import { useQuery } from "@tanstack/react-query";
import { loadHodApprovers, loadBaseDepartments } from "@/lib/loadAppDataV2";
import ITConfirmationModal from "./ITConfirmationModal";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "../SubmittingOverlay";
import AlertModal from "../AlertModal";
import { AlertInfo } from "../TravelRequisitionPage";
import { useToggleStore } from "@/store/useToggleStore";

// ---- Constants ----
const REQUEST_TYPES = ["Replacement", "New"];

const IT_REQUIREMENTS = [
  "Laptop",
  "Desktop",
  "Email",
  "Orion",
  "DMS",
  "Qlik",
  "Phone Extension",
  "Dialing Code",
] as const;

// ---- Types ----
export interface ITFormData {
  employeeName: string;
  department: string;
  staffNumber: string;
  requestType: string;
  hodApprover: string;
  requirements: string[];
  otherRequirements: string;
  requisitionDate: string;
  dateJoining: string;
}

const InitialFormState: ITFormData = {
  employeeName: "",
  department: "",
  staffNumber: "",
  requestType: "",
  hodApprover: "",
  requirements: [],
  otherRequirements: "",
  requisitionDate: "",
  dateJoining: "",
};

// ---- Sub-component prop types ----
interface FormInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

interface FormSelectProps {
  label: string;
  options: string[];
  value: string;
  loading?: boolean;
  onChange: (value: string) => void;
}

interface CheckboxGroupProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

// ---- Main Page ----
export default function ITRequisitionPage() {
  const { username, email } = useUser();

  const triggerScroll = useToggleStore((state) => state.triggerScroll);
  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);

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

  const [formData, setFormData] = useState<ITFormData>(InitialFormState);
  const [step, setStep] = useState(1);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Required fields for button disable check (otherRequirements is optional)
  const requiredFields: (keyof ITFormData)[] = [
    "employeeName",
    "department",
    "staffNumber",
    "requestType",
    "hodApprover",
    "requisitionDate",
    "dateJoining",
  ];

  const buttonDisabled =
    requiredFields.some((field) => !formData[field]) ||
    formData.requirements.length === 0;

  const updateField = <K extends keyof ITFormData>(
    field: K,
    value: ITFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      formData: {
        ...formData,
        // Default otherRequirements if empty
        otherRequirements:
          formData.otherRequirements || "No other requirements",
      },
      submittedBy: {
        name: username,
        email: email,
      },
    };

    setSubmitting(true);

    try {
      const response = await ApiHandler(
        "/api/itrequisition/submitrequisition",
        "POST",
        payload,
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message ||
            "An error occurred while trying to submit your IT requisition",
        );

      setAlertInfo({
        alertType: "success",
        alertMessage:
          data.message ||
          "Your IT requisition has been submitted successfully, you will receive a confirmation email shortly",
      });

      setFormData(InitialFormState);
      setStep(3);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while trying to submit IT requisition", error);
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

      {step === 3 && <AlertModal alertInfo={alertInfo} setStep={setStep} />}

      {step === 2 && (
        <ITConfirmationModal
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
          {/* Form Image */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.it_form_image}
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
                IT Requisition
              </h1>
              <p className="mt-1 text-[14px] text-[#7c5a5a]">
                Submit your IT requirements for approval.
              </p>
            </div>
          </header>

          {/* Advance Notice Tip Card */}
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-linear-to-br from-amber-50 to-orange-50 p-4 shadow-xs">
            <div className="flex shrink-0 items-center justify-center rounded-xl bg-amber-100/50 p-2">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="pt-0.5">
              <h4 className="text-sm font-semibold tracking-tight text-amber-900">
                Advance Notice Recommended
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                IT recommends making a requisition at least{" "}
                <strong>2 weeks prior</strong> to facilitate proper planning and
                preparation for the requested equipment.
              </p>
            </div>
          </div>

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
              {/* Section 1: Employee Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <UserRound size={16} /> Main Info
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <FormInput
                    label="Employee Name"
                    placeholder="Full Name"
                    value={formData.employeeName}
                    onChange={(v) => updateField("employeeName", v)}
                  />
                  <FormSelect
                    label="Department"
                    options={DEPARTMENTS}
                    value={formData.department}
                    loading={departmentsLoading}
                    onChange={(v) => updateField("department", v)}
                  />
                  <FormInput
                    label="Staff Number"
                    placeholder="Employee staff number"
                    value={formData.staffNumber}
                    onChange={(v) => updateField("staffNumber", v)}
                  />
                  <FormSelect
                    label="Replacement / New"
                    options={REQUEST_TYPES}
                    value={formData.requestType}
                    onChange={(v) => updateField("requestType", v)}
                  />
                  <FormSelect
                    label="HOD Approver"
                    options={HOD_APPROVERS}
                    value={formData.hodApprover}
                    loading={hodsLoading}
                    onChange={(v) => updateField("hodApprover", v)}
                  />

                  {/* Dates */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Requisition Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.requisitionDate}
                      onChange={(v) => updateField("requisitionDate", v)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Date Joining <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.dateJoining}
                      onChange={(v) => updateField("dateJoining", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Requirements */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <CheckSquare size={16} /> Requirements
                </h2>
                <CheckboxGroup
                  label="Select all that apply"
                  options={IT_REQUIREMENTS}
                  selected={formData.requirements}
                  onChange={(v) => updateField("requirements", v)}
                />

                {/* Other Requirements textarea */}
                <div className="mt-5 flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#7c5a5a]">
                    Other Requirements{" "}
                    <span className="text-[11px] font-normal text-[#a18080]">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    className="h-25 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                    placeholder="Specify any other requirements not listed above..."
                    value={formData.otherRequirements}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      updateField("otherRequirements", e.target.value)
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={buttonDisabled}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Proceed
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-left text-xs">
                **All fields are required except Other Requirements. At least
                one requirement must be selected.**
              </p>
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

function FormSelect({
  label,
  options,
  value,
  onChange,
  loading,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none disabled:cursor-progress"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <span className={value ? "text-[#1e1b1b]" : "text-[#a18080]"}>
          {value || "Select..."}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[rgba(240,180,180,0.6)] bg-white p-1 shadow-[0_10px_25px_rgba(160,60,60,0.1)] [scrollbar-width:thin]">
            {options.map((opt) => (
              <div
                key={opt}
                className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-[#1e1b1b] transition-all duration-200 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: CheckboxGroupProps) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </p>
      <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200 ${
                checked
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-[rgba(240,180,180,0.6)] bg-white/80 text-[#1e1b1b] hover:border-rose-200 hover:bg-rose-50/50"
              }`}
            >
              {/* Custom checkbox visual */}
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                  checked
                    ? "bg-neutral-900 text-white"
                    : "border-[rgba(240,180,180,0.8)] bg-white"
                }`}
              >
                {checked && (
                  <Check
                    className="h-3 w-3"
                    strokeWidth={3} // Increased stroke to match the "bold" look of your SVG
                  />
                )}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(opt)}
              />
              {opt === "DMS" ? "DMS (Document Management System)" : opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}
