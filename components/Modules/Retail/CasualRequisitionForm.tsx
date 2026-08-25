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
  Check,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadHodApprovers, loadBaseDepartments } from "@/lib/loadAppDataV2";
import {
  assets,
  getCasualLocationsForDepartment,
  getCasualSections,
  getCasualRatePerDay,
  ENGINEERING_HVAC_DEPARTMENT,
  CASUAL_CATEGORIES,
  CasualCategory,
} from "@/public/assets";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import AlertModal from "@/components/AlertModal";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import CasualConfirmationModal from "./CasualConfirmationModal";
import { useToggleStore } from "@/store/useToggleStore";
import Image from "next/image";

// ---- Types ----
export interface CasualSectionFormData {
  sectionName: string;
  justification: string;
  numberOfCasuals: number;
  ppesRequired: string;
  periodFrom: string;
  periodTo: string;
}

export interface CasualFormData {
  department: string;
  hodApprover: string;
  location: string;
  sections: CasualSectionFormData[];
  casualCategory?: CasualCategory;
}

const InitialFormState: CasualFormData = {
  department: "",
  hodApprover: "",
  location: "",
  sections: [],
  casualCategory: undefined,
};

const EmptySection = (sectionName: string): CasualSectionFormData => ({
  sectionName,
  justification: "",
  numberOfCasuals: 0,
  ppesRequired: "",
  periodFrom: "",
  periodTo: "",
});

// ---- Derived helpers ----
export function computeEngagementDays(periodFrom: string, periodTo: string) {
  if (!periodFrom || !periodTo) return 0;

  const from = new Date(periodFrom + "T00:00:00");
  const to = new Date(periodTo + "T00:00:00");
  const diffDays =
    Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return diffDays > 0 ? diffDays : 0;
}

// ---- Sub-component prop types ----
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

  const availableLocations = formData.department
    ? getCasualLocationsForDepartment(formData.department)
    : [];

  const availableSections = formData.location
    ? getCasualSections(formData.department, formData.location)
    : [];
  const hasSectionChoice = availableSections.length > 1;

  const ratePerDay = formData.location
    ? getCasualRatePerDay(
        formData.location,
        formData.department,
        formData.casualCategory,
      )
    : 0;

  // Per-section derived engagement days + total
  const sectionDerived = useMemo(
    () =>
      formData.sections.map((section) => {
        const engagementDays = computeEngagementDays(
          section.periodFrom,
          section.periodTo,
        );
        const totalAmount =
          section.numberOfCasuals * ratePerDay * engagementDays;
        return { engagementDays, totalAmount };
      }),
    [formData.sections, ratePerDay],
  );

  const overallTotalAmount = sectionDerived.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  );
  const overallTotalCasuals = formData.sections.reduce(
    (sum, s) => sum + s.numberOfCasuals,
    0,
  );

  const isEmpty = (val: unknown) =>
    val === null || val === undefined || val === "";

  const sectionsInvalid =
    formData.sections.length === 0 ||
    formData.sections.some((section, index) => {
      const invalidDateRange =
        !!section.periodFrom &&
        !!section.periodTo &&
        section.periodTo < section.periodFrom;

      return (
        isEmpty(section.justification) ||
        isEmpty(section.ppesRequired) ||
        isEmpty(section.periodFrom) ||
        isEmpty(section.periodTo) ||
        section.numberOfCasuals <= 0 ||
        invalidDateRange ||
        sectionDerived[index] === undefined
      );
    });

  const buttonDisabled =
    isEmpty(formData.department) ||
    isEmpty(formData.hodApprover) ||
    isEmpty(formData.location) ||
    sectionsInvalid;

  const updateField = <K extends keyof CasualFormData>(
    field: K,
    value: CasualFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (department: string) => {
    setFormData((prev) => ({
      ...prev,
      department,
      // Available locations/sections depend on the department - reset both
      location: "",
      sections: [],
      casualCategory:
        department === ENGINEERING_HVAC_DEPARTMENT ? "Technician" : undefined,
    }));
  };

  const handleLocationChange = (location: string) => {
    const sections = getCasualSections(formData.department, location);

    setFormData((prev) => ({
      ...prev,
      location,
      // Single-section departments skip the picker and go straight to the fieldset
      sections: sections.length === 1 ? [EmptySection(sections[0])] : [],
    }));
  };

  const toggleSection = (sectionName: string) => {
    setFormData((prev) => {
      const exists = prev.sections.some((s) => s.sectionName === sectionName);

      return {
        ...prev,
        sections: exists
          ? prev.sections.filter((s) => s.sectionName !== sectionName)
          : [...prev.sections, EmptySection(sectionName)],
      };
    });
  };

  const updateSectionField = <K extends keyof CasualSectionFormData>(
    sectionName: string,
    field: K,
    value: CasualSectionFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.sectionName === sectionName ? { ...s, [field]: value } : s,
      ),
    }));
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
          ratePerDay={ratePerDay}
          sectionDerived={sectionDerived}
          overallTotalAmount={overallTotalAmount}
          overallTotalCasuals={overallTotalCasuals}
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
                    onChange={handleDepartmentChange}
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
                    options={availableLocations}
                    value={formData.location}
                    onChange={handleLocationChange}
                  />
                  {formData.department === ENGINEERING_HVAC_DEPARTMENT && (
                    <FormSelect
                      label="Casual Category"
                      options={[...CASUAL_CATEGORIES]}
                      value={formData.casualCategory ?? "Technician"}
                      onChange={(v) =>
                        updateField("casualCategory", v as CasualCategory)
                      }
                    />
                  )}
                </div>
              </div>

              {/* Section 2: Sections */}
              {formData.location && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                    <HardHat size={16} /> Sections
                  </h2>
                  {hasSectionChoice && (
                    <h4 className="mb-4 text-[13px] text-[#a18080]">
                      Select the sections you&apos;re requesting casuals for
                    </h4>
                  )}

                  {hasSectionChoice && (
                    <div className="mb-6 flex flex-wrap gap-2.5">
                      {availableSections.map((sectionName) => {
                        const active = formData.sections.some(
                          (s) => s.sectionName === sectionName,
                        );
                        return (
                          <button
                            key={sectionName}
                            type="button"
                            onClick={() => toggleSection(sectionName)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                              active
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-[rgba(240,180,180,0.6)] bg-white/80 text-[#7c5a5a] hover:border-rose-300"
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5" />}
                            {sectionName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {formData.sections.length === 0 && hasSectionChoice && (
                    <p className="text-[13px] text-[#a18080]">
                      Select at least one section above to continue.
                    </p>
                  )}

                  <div className="flex flex-col gap-6">
                    {formData.sections.map((section, index) => (
                      <SectionFieldset
                        key={section.sectionName}
                        section={section}
                        showRemove={hasSectionChoice}
                        engagementDays={
                          sectionDerived[index]?.engagementDays ?? 0
                        }
                        totalAmount={sectionDerived[index]?.totalAmount ?? 0}
                        ratePerDay={ratePerDay}
                        onRemove={() => toggleSection(section.sectionName)}
                        onChange={(field, value) =>
                          updateSectionField(section.sectionName, field, value)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Overall Summary */}
              {formData.sections.length > 0 && (
                <div className="col-span-full">
                  <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                    <Wallet size={16} /> Overall Summary
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
                      <span>Total Casuals</span>
                      <span className="text-xl">{overallTotalCasuals}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-5 font-semibold text-white shadow-lg">
                      <span>Total (KES)</span>
                      <span className="text-xl">
                        {overallTotalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

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

function SectionFieldset({
  section,
  showRemove,
  engagementDays,
  totalAmount,
  ratePerDay,
  onRemove,
  onChange,
}: {
  section: CasualSectionFormData;
  showRemove: boolean;
  engagementDays: number;
  totalAmount: number;
  ratePerDay: number;
  onRemove: () => void;
  onChange: <K extends keyof CasualSectionFormData>(
    field: K,
    value: CasualSectionFormData[K],
  ) => void;
}) {
  const invalidDateRange =
    !!section.periodFrom &&
    !!section.periodTo &&
    section.periodTo < section.periodFrom;

  return (
    <div className="rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#1e1b1b]">
          {section.sectionName}
        </h3>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Number of Casuals <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={section.numberOfCasuals || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("numberOfCasuals", Number(e.target.value))
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Period From <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={section.periodFrom}
            onChange={(v) => onChange("periodFrom", v)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Period To <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={section.periodTo}
            onChange={(v) => onChange("periodTo", v)}
            minDate={section.periodFrom || undefined}
          />
        </div>
      </div>
      {invalidDateRange && (
        <p className="mt-2 text-xs font-medium text-red-500">
          Period To cannot be earlier than Period From.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            className="h-20 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            placeholder="State the reason casual staff are required..."
            value={section.justification}
            required
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange("justification", e.target.value)
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            PPEs Required <span className="text-red-500">*</span>
          </label>
          <textarea
            className="h-20 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            placeholder="List the personal protective equipment required..."
            value={section.ppesRequired}
            required
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange("ppesRequired", e.target.value)
            }
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center">
          <p className="text-[11px] text-[#7c5a5a]">Rate / Day</p>
          <p className="mt-0.5 text-[14px] font-semibold text-[#1e1b1b]">
            KES {ratePerDay.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center">
          <p className="text-[11px] text-[#7c5a5a]">Engagement Days</p>
          <p className="mt-0.5 text-[14px] font-semibold text-[#1e1b1b]">
            {engagementDays}
          </p>
        </div>
        <div className="rounded-xl bg-linear-to-r from-slate-800 to-rose-900 px-3 py-3 text-center text-white">
          <p className="text-[11px] text-white/70">Total (KES)</p>
          <p className="mt-0.5 text-[14px] font-semibold">
            {totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FormSelect({
  label,
  options,
  value,
  onChange,
  loading,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const searchValue = searchQuery.toLowerCase();

    return options.filter((option) =>
      option.toLowerCase().includes(searchValue),
    );
  }, [options, searchQuery]);

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
          <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white px-1 py-2 shadow-[0_10px_25px_rgba(160,60,60,0.1)]">
            {/* SEARCH INPUT - Search threshold of six*/}
            {options.length > 6 && (
              <div className="relative px-1 pb-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-full border border-neutral-200 bg-neutral-100 py-2 pr-8 pl-8 text-xs text-neutral-900 placeholder-neutral-400 transition-colors focus:border-rose-500 focus:bg-white focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-60 scrollbar-thin overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
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
                ))
              ) : (
                /* Fallback state when no options exist */
                <div className="px-3 py-6 text-center text-sm text-neutral-400">
                  {searchQuery
                    ? "No matching results found."
                    : "No results found for this selection"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
