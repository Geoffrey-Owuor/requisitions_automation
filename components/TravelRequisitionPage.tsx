"use client";

import { useUser } from "@/context/UserContext";
import { useState, ChangeEvent, useMemo } from "react";
import { DatePicker } from "./DatePicker";
import {
  ChevronDown,
  Wallet,
  UserRound,
  ArrowRight,
  Info,
  MapPin,
  Plane,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { assets } from "@/public/assets";
import {
  TRAVEL_CATEGORIES,
  TRAVEL_MODES,
  BUDGET_STATUS,
} from "@/public/assets";
import { useQuery } from "@tanstack/react-query";
import { loadBaseDepartments, loadHodApprovers } from "@/lib/loadAppDataV2";
import TravelConfirmationModal from "./TravelConfirmationModal";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "./SubmittingOverlay";
import AlertModal from "./AlertModal";
import { EngineeringJobFields, EngineeringJob } from "./EngineeringJobFields";

export interface TravelFormData {
  employeeName: string;
  department: string;
  designation: string;
  hodApprover: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelCategory: string;
  justification: string;
  travelMode: string;
  transportCost: number;
  otherCost: number;
  perDiem: number;
  costCentre: string;
  withinBudget: string;
  engineeringJobs: EngineeringJob[];
}

const InitialFormState: TravelFormData = {
  employeeName: "",
  department: "",
  designation: "",
  hodApprover: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  travelCategory: "",
  justification: "",
  travelMode: "",
  transportCost: 0,
  otherCost: 0,
  perDiem: 0,
  costCentre: "",
  withinBudget: "",
  engineeringJobs: [{ id: "init-1", title: "", amount: 0 }],
};

export interface AlertInfo {
  alertType: "" | "success" | "error";
  alertMessage: string;
}

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

export default function TravelRequisitionPage() {
  const { username, email } = useUser();

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

  const [formData, setFormData] = useState<TravelFormData>(InitialFormState);

  const [step, setStep] = useState(1);

  //alert object
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Check if department is engineering
  const isEngineering = formData.department === "Engineering & HVAC";

  // More robust validation logic
  // Returns true only if the value is genuinely missing (Allowing 0 values)
  const isEmpty = (val: string | number) =>
    val === null || val === undefined || val === "";

  const buttonDisabled =
    Object.entries(formData).some(([key, value]) => {
      if (key === "engineeringJobs") return false;
      return isEmpty(value);
    }) ||
    (isEngineering &&
      formData.engineeringJobs.some(
        (job) => !job.title || isEmpty(job.amount),
      ));

  // Getting the total cost
  const totalCost =
    formData.transportCost + formData.otherCost + formData.perDiem;

  // Generating an approval tier
  const generatedAprovalTier = useMemo(() => {
    if (!formData.travelCategory || !formData.travelMode || totalCost === 0)
      return "Tier 1";

    let approvalTier;
    if (
      formData.travelCategory === "Local" &&
      formData.travelMode === "Road" &&
      Number(totalCost) <= 30000
    ) {
      approvalTier = "Tier 1";
    } else if (
      formData.travelCategory === "International" ||
      Number(totalCost) >= 100000
    ) {
      approvalTier = "Tier 3";
    } else {
      approvalTier = "Tier 2";
    }

    return approvalTier;
  }, [formData.travelCategory, formData.travelMode, totalCost]);

  // Calculate total engineering job costs
  const totalEngineeringCost = useMemo(() => {
    // Only calculate if they are in the Engineering department
    if (formData.department !== "Engineering & HVAC") return 0;

    return formData.engineeringJobs.reduce((sum, job) => {
      return sum + job.amount;
    }, 0); // 0 is the starting value of the some here
  }, [formData.department, formData.engineeringJobs]);

  const handleSubmit = async () => {
    // 1. Format the engineering jobs array into the required text format
    let formattedEngineeringJobs = "";
    if (formData.department === "Engineering & HVAC") {
      formattedEngineeringJobs = formData.engineeringJobs
        .map((job) => `${job.title.trim()} - ${job.amount}`)
        .join("\n");
    }

    const payload = {
      formData: {
        ...formData,
        // We override this property specifically for the database string
        engineeringJobs: formattedEngineeringJobs,
      },
      totalCost,
      approvalTier: generatedAprovalTier,
      submittedBy: {
        name: username,
        email: email,
      },
    };

    setSubmitting(true);

    // Posting the submitted data
    try {
      const response = await ApiHandler(
        "/api/travelrequisition/submitrequisition",
        "POST",
        payload,
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message ||
            "An error occurred while trying to submit your requisition",
        );

      // Response is ok - set the alert object
      setAlertInfo({
        alertType: "success",
        alertMessage:
          data.message ||
          "Your requisition has been submitted successfully, you will receive a confirmation email shortly",
      });

      // Clear the form data
      setFormData(InitialFormState);

      // set step to to show final modal step
      setStep(3);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while trying to submit your requisition", error);
        const errorString = error.toString();
        setAlertInfo({ alertType: "error", alertMessage: errorString });

        setStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof TravelFormData>(
    field: K,
    value: TravelFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative p-4">
      {submitting && <SubmittingOverlay />}
      {step === 3 && <AlertModal alertInfo={alertInfo} setStep={setStep} />}
      {step === 2 && (
        <TravelConfirmationModal
          formData={formData}
          totalCost={totalCost}
          approvalTier={generatedAprovalTier}
          onBack={() => {
            setStep(1);
            const dashboardDiv = document.getElementById("modal-wrapper");
            dashboardDiv?.scrollTo({ top: 0, behavior: "instant" });
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          totalEngineeringAmount={totalEngineeringCost}
        />
      )}
      {step === 1 && (
        <div className="relative z-10 mx-auto max-w-225">
          {/* Form Image */}
          <div className="mb-4 overflow-hidden rounded-3xl">
            <Image
              src={assets.form_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center" // or "object-cover" depending on your needs
              priority
              alt="Form Image"
            />
          </div>
          {/* Header */}
          <header className="mb-8 flex items-end justify-between max-sm:flex-col max-sm:items-start max-sm:gap-5">
            <div>
              <h1 className="m-0 text-2xl font-semibold tracking-[-0.5px] text-[#1e1b1b]">
                Travel Requisition
              </h1>
              <p className="mt-1 text-[14px] text-[#7c5a5a]">
                Submit your business travel details for approval.
              </p>
            </div>
          </header>

          {/* Compact Travel Approval Tiers Guideline Card */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {/* Header Area */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <Info className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold tracking-tight text-slate-800">
                Travel Approval Tiers
              </h3>
            </div>

            {/* Tiers List (Horizontal/Compact rows) */}
            <div className="flex flex-col divide-y divide-slate-100">
              {/* Tier 1 */}
              <div className="flex flex-col justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">
                      Tier 1: Local Road
                    </span>
                    <span className="mx-2 hidden text-slate-300 sm:inline">
                      |
                    </span>
                    <span className="block text-xs text-slate-500 sm:inline sm:text-sm">
                      Under KES 30,000
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> HOD
                  </span>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="flex flex-col justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">
                      Tier 2: Local Air
                    </span>
                    <span className="mx-2 hidden text-slate-300 sm:inline">
                      |
                    </span>
                    <span className="block text-xs text-slate-500 sm:inline sm:text-sm">
                      KES 30,000 - 100,000
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-blue-500" /> HOD
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-blue-500" /> HR
                  </span>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="flex flex-col justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">
                      Tier 3: International
                    </span>
                    <span className="mx-2 hidden text-slate-300 sm:inline">
                      |
                    </span>
                    <span className="block text-xs text-slate-500 sm:inline sm:text-sm">
                      Over KES 100,000
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-violet-500" /> HOD
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-violet-500" /> HR
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-violet-500" />{" "}
                    Director
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-white/85 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
            <form
              className="flex flex-col gap-10"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
                const dashboardDiv = document.getElementById("modal-wrapper");
                dashboardDiv?.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              {/* Section 1: Employee Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <UserRound size={16} /> Employee Details
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <FormInput
                    label="Employee Name"
                    placeholder="Full Name"
                    value={formData.employeeName}
                    onChange={(v) => updateField("employeeName", String(v))}
                  />
                  <FormSelect
                    label="Department"
                    options={DEPARTMENTS}
                    value={formData.department}
                    loading={departmentsLoading}
                    onChange={(v) => updateField("department", v)}
                  />
                  <FormInput
                    label="Designation"
                    placeholder="Job Title"
                    value={formData.designation}
                    onChange={(v) => updateField("designation", String(v))}
                  />
                  <FormSelect
                    label="Cost Centre"
                    options={DEPARTMENTS}
                    value={formData.costCentre}
                    loading={departmentsLoading}
                    onChange={(v) => updateField("costCentre", v)}
                  />
                  <FormSelect
                    label="Hod Approver"
                    options={HOD_APPROVERS}
                    value={formData.hodApprover}
                    loading={hodsLoading}
                    onChange={(v) => updateField("hodApprover", v)}
                  />
                </div>
              </div>

              {/* Section 2: Trip Details */}
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <MapPin size={16} /> Trip Information
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <FormInput
                    label="Destination"
                    placeholder="City, Country, Place"
                    value={formData.destination}
                    onChange={(v) => updateField("destination", String(v))}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Departure Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.departureDate}
                      onChange={(v) => updateField("departureDate", v)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Return Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.returnDate}
                      onChange={(v) => updateField("returnDate", v)}
                    />
                  </div>
                  <FormSelect
                    label="Travel Category"
                    options={TRAVEL_CATEGORIES}
                    value={formData.travelCategory}
                    onChange={(v) => updateField("travelCategory", v)}
                  />
                </div>
              </div>

              {/* Section 3: Logistics */}
              <div className="col-span-full">
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <Plane size={16} /> Logistics & Justification
                </h2>
                <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                  <FormSelect
                    label="Requested Mode of Travel"
                    options={TRAVEL_MODES}
                    value={formData.travelMode}
                    onChange={(v) => updateField("travelMode", v)}
                  />
                  <FormSelect
                    label="Within Budget?"
                    options={BUDGET_STATUS}
                    value={formData.withinBudget}
                    onChange={(v) => updateField("withinBudget", v)}
                  />
                  <div className="col-span-2 flex flex-col gap-2 max-sm:col-span-1">
                    <label className="text-[13px] font-medium text-[#7c5a5a]">
                      Business Justification{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="h-25 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                      placeholder="Describe the purpose of this trip..."
                      value={formData.justification}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("justification", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Cost Estimation */}
              <div className="col-span-full">
                <h2 className="mb-5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                  <Wallet size={16} /> Estimated Costs (KES)
                </h2>
                <div className="grid grid-cols-3 gap-3.75 max-sm:grid-cols-1">
                  <FormInput
                    type="number"
                    label="Transport (2-way)"
                    value={formData.transportCost}
                    onChange={(v) => updateField("transportCost", Number(v))}
                  />

                  <FormInput
                    type="number"
                    label="Others/Misc"
                    value={formData.otherCost}
                    onChange={(v) => updateField("otherCost", Number(v))}
                  />
                  <FormInput
                    type="number"
                    label="Per Diem Entitlement"
                    value={formData.perDiem}
                    onChange={(v) => updateField("perDiem", Number(v))}
                  />
                </div>

                {/* NEW: Conditional Engineering Jobs Component */}
                {formData.department === "Engineering & HVAC" && (
                  <EngineeringJobFields
                    jobs={formData.engineeringJobs}
                    totalAmount={totalEngineeringCost}
                    onChange={(jobs) => updateField("engineeringJobs", jobs)}
                  />
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Total Cost - Deep Slate Red */}
                  <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-5 font-semibold text-white shadow-lg">
                    <span>Total Estimated Cost</span>
                    <span className="text-2xl">
                      KES {totalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* Approval Tier - Muted Rose Ash */}
                  <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
                    <span>Approval Tier</span>
                    <span className="text-2xl">{generatedAprovalTier}</span>
                  </div>
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
              <p className="text-left text-xs text-[#7c5a5a]">
                **All fields are required**
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Strictly Typed Helper Components ---

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
        className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
        placeholder={placeholder}
        value={value}
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
        disabled={loading}
        type="button"
        className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none disabled:cursor-progress"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || "Select..."}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
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
