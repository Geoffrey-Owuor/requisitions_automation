"use client";

import { useUser } from "@/context/UserContext";
import { useState, ChangeEvent, useMemo } from "react";
import { DatePicker } from "@/components/DatePicker";
import {
  ChevronDown,
  UserRound,
  ArrowRight,
  HardHat,
  Wallet,
  CalendarRange,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadHodApprovers, loadBaseDepartments } from "@/lib/loadAppDataV2";
import { assets, CASUAL_LOCATIONS, getCasualRatePerDay } from "@/public/assets";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import AlertModal from "@/components/AlertModal";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import CasualConfirmationModal from "./CasualConfirmationModal";
import { useToggleStore } from "@/store/useToggleStore";
import Image from "next/image";

// ---- Types ----
export interface CasualFormData {
  department: string;
  hodApprover: string;
  location: string;
  justification: string;
  numberOfCasuals: number;
  ppesRequired: string;
  periodFrom: string;
  periodTo: string;
}

const InitialFormState: CasualFormData = {
  department: "",
  hodApprover: "",
  location: "",
  justification: "",
  numberOfCasuals: 0,
  ppesRequired: "",
  periodFrom: "",
  periodTo: "",
};

// ---- Sub-component prop types ----
interface FormInputProps {
  label: string;
  type?: "text" | "number";
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
}

interface FormSelectProps {
  label: string;
  options: string[];
  value: string;
  loading?: boolean;
  onChange: (value: string) => void;
}

// ---- Main Page ----
export default function CasualRequisitionForm() {
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

  const [formData, setFormData] = useState<CasualFormData>(InitialFormState);
  const [step, setStep] = useState(1);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Derived rate/day, engagement days (inclusive) and total amount
  const ratePerDay = formData.location
    ? getCasualRatePerDay(formData.location)
    : 0;

  const engagementDays = useMemo(() => {
    if (!formData.periodFrom || !formData.periodTo) return 0;

    const from = new Date(formData.periodFrom + "T00:00:00");
    const to = new Date(formData.periodTo + "T00:00:00");
    const diffDays =
      Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return diffDays > 0 ? diffDays : 0;
  }, [formData.periodFrom, formData.periodTo]);

  const totalAmount = formData.numberOfCasuals * ratePerDay * engagementDays;

  const isEmpty = (val: unknown) =>
    val === null || val === undefined || val === "";

  const requiredStringFields: (keyof CasualFormData)[] = [
    "department",
    "hodApprover",
    "location",
    "justification",
    "ppesRequired",
    "periodFrom",
    "periodTo",
  ];

  const invalidDateRange =
    !!formData.periodFrom &&
    !!formData.periodTo &&
    formData.periodTo < formData.periodFrom;

  const buttonDisabled =
    requiredStringFields.some((field) => isEmpty(formData[field])) ||
    formData.numberOfCasuals <= 0 ||
    invalidDateRange;

  const updateField = <K extends keyof CasualFormData>(
    field: K,
    value: CasualFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      formData,
      engagementDays,
      ratePerDay,
      totalAmount,
      submittedBy: {
        name: username,
        email: email,
      },
    };

    setSubmitting(true);

    try {
      const response = await ApiHandler(
        "/api/casualrequisition/submitrequisition",
        "POST",
        payload,
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message ||
            "An error occurred while trying to submit your Casual requisition",
        );

      setAlertInfo({
        alertType: "success",
        alertMessage:
          data.message ||
          "Your Casual requisition has been submitted successfully, you will receive a confirmation email shortly",
      });

      setFormData(InitialFormState);
      setStep(3);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while trying to submit Casual requisition", error);
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
        <CasualConfirmationModal
          formData={formData}
          engagementDays={engagementDays}
          ratePerDay={ratePerDay}
          totalAmount={totalAmount}
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
              src={assets.casual_form_image}
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
                Casual Requisition
              </h1>
              <p className="mt-1 text-[14px] text-[#7c5a5a]">
                Submit your request for casual staff engagement.
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
              {/* Section 1: Requisition Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <UserRound size={16} /> Requisition Details
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
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
                  <FormSelect
                    label="Location"
                    options={CASUAL_LOCATIONS}
                    value={formData.location}
                    onChange={(v) => updateField("location", v)}
                  />
                  <FormInput
                    type="number"
                    label="Number of Casuals"
                    value={formData.numberOfCasuals}
                    onChange={(v) => updateField("numberOfCasuals", Number(v))}
                  />
                </div>
              </div>

              {/* Section 2: Engagement Period */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <CalendarRange size={16} /> Engagement Period
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Period From <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.periodFrom}
                      onChange={(v) => updateField("periodFrom", v)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Period To <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.periodTo}
                      onChange={(v) => updateField("periodTo", v)}
                      minDate={formData.periodFrom || undefined}
                    />
                  </div>
                </div>
                {invalidDateRange && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    Period To cannot be earlier than Period From.
                  </p>
                )}
              </div>

              {/* Section 3: Justification & PPEs */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <HardHat size={16} /> Justification & PPEs
                </h2>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="h-24 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      placeholder="State the reason casual staff are required..."
                      value={formData.justification}
                      required
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("justification", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      PPEs Required <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="h-24 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      placeholder="List the personal protective equipment required..."
                      value={formData.ppesRequired}
                      required
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("ppesRequired", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Rate Summary */}
              <div className="col-span-full">
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <Wallet size={16} /> Rate Summary
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
                    <span>Rate / Day</span>
                    <span className="text-xl">
                      KES {ratePerDay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
                    <span>Engagement Days</span>
                    <span className="text-xl">{engagementDays}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-5 font-semibold text-white shadow-lg">
                    <span>Total (KES)</span>
                    <span className="text-xl">
                      {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
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
                  All fields are required to proceed.
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

function FormInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        min={type === "number" ? 1 : undefined}
        className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const val =
            type === "number" ? Number(e.target.value) : e.target.value;
          onChange(val);
        }}
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
          <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 scrollbar-thin overflow-y-auto rounded-xl border border-[rgba(240,180,180,0.6)] bg-white p-1 shadow-[0_10px_25px_rgba(160,60,60,0.1)]">
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
