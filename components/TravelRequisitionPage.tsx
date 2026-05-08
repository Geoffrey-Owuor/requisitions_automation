"use client";

import { useUser } from "@/context/UserContext";
import { useState, ChangeEvent, useMemo } from "react";
import { DatePicker } from "./DatePicker";
import {
  ChevronDown,
  Plane,
  MapPin,
  Wallet,
  UserRound,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { assets, initialsHelper } from "@/public/assets";
import {
  TRAVEL_CATEGORIES,
  TRAVEL_MODES,
  BUDGET_STATUS,
} from "@/public/assets";
import { HOD_APPROVERS, DEPARTMENTS } from "@/secretAssets";
import TravelConfirmationModal from "./TravelConfirmationModal";
import { ApiHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "./SubmittingOverlay";
import AlertModal from "./AlertModal";
import UserDropdown from "./UserDropDown";

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
  onChange: (value: string) => void;
}

export default function TravelRequisitionPage() {
  const { username, email } = useUser();

  const nameString = username ? username : "";

  const [formData, setFormData] = useState<TravelFormData>(InitialFormState);

  const [step, setStep] = useState(1);

  //alert object
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  const buttonDisabled = Object.values(formData).some((value) => !value);

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

  const handleSubmit = async () => {
    const payload = {
      formData,
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
      // scroll to page top
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while trying to submit your requisition", error);
        const errorString = error.toString();
        setAlertInfo({ alertType: "error", alertMessage: errorString });

        setStep(3);
        window.scrollTo({ top: 0, behavior: "instant" });
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
    <div className="relative min-h-screen p-5">
      {submitting && <SubmittingOverlay />}
      {step === 3 && <AlertModal alertInfo={alertInfo} setStep={setStep} />}
      {step === 2 && (
        <TravelConfirmationModal
          formData={formData}
          totalCost={totalCost}
          approvalTier={generatedAprovalTier}
          onBack={() => {
            setStep(1);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
      {step === 1 && (
        <div className="relative z-10 mx-auto max-w-225">
          {/* Form Image */}
          <div className="mb-4 overflow-hidden rounded-xl">
            <Image
              src={assets.form_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center" // or "object-cover" depending on your needs
              priority // Use this if the image is above the fold
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

            {/* User Info Card */}
            <UserDropdown
              initials={initialsHelper(nameString)}
              userName={username}
              userEmail={email}
            />
          </header>

          {/* Form Card */}
          <div className="rounded-3xl border border-white/85 bg-white/65 p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl">
            <form
              className="flex flex-col gap-10"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
                window.scrollTo({ top: 0, behavior: "instant" });
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
                    onChange={(v) => updateField("costCentre", v)}
                  />
                  <FormSelect
                    label="Hod Approver"
                    options={HOD_APPROVERS}
                    value={formData.hodApprover}
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
              <p className="text-left text-xs">**All fields are required**</p>
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

function FormSelect({ label, options, value, onChange }: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || "Select..."}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

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
