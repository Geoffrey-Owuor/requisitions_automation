"use client";

import { useSession } from "next-auth/react";
import { useState, ChangeEvent } from "react";
import { DatePicker } from "./DatePicker";
import SignOutButton from "./SignOutButton";
import { ChevronDown, Plane, MapPin, Wallet, UserRound } from "lucide-react";

interface TravelFormData {
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
  accommodationCost: number;
  otherCost: number;
  perDiem: number;
  costCentre: string;
  withinBudget: string;
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

// --- Constants ---
const DEPARTMENTS = [
  "Finance",
  "Engineering",
  "Marketing",
  "Operations",
  "Sales",
  "HR",
];

// Approvers
const HOD_APPROVERS = ["Mwende", "Wazimu"];
const TRAVEL_CATEGORIES = ["International", "Domestic", "Local"];
const TRAVEL_MODES = ["Flight", "Train", "Rental Car", "Personal Vehicle"];
const COST_CENTRES = ["CC-101 (Ops)", "CC-202 (Dev)", "CC-303 (Mktg)"];
const BUDGET_STATUS = ["Yes", "No", "Pending Review"];

export default function TravelRequisitionPage() {
  const { data: session } = useSession();

  const [formData, setFormData] = useState<TravelFormData>({
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
    accommodationCost: 0,
    otherCost: 0,
    perDiem: 0,
    costCentre: "",
    withinBudget: "",
  });

  const buttonDisabled = Object.values(formData).some((value) => !value);

  const totalCost =
    formData.transportCost +
    formData.accommodationCost +
    formData.otherCost +
    formData.perDiem;

  const updateField = <K extends keyof TravelFormData>(
    field: K,
    value: TravelFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="font-sans min-h-screen relative overflow-x-hidden px-5 py-10">
      <div className="max-w-250 mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-end mb-8 max-sm:flex-col max-sm:items-start max-sm:gap-5">
          <div>
            <h1 className="text-[28px] font-semibold m-0 tracking-[-0.5px] text-[#1e1b1b]">
              Travel Requisition
            </h1>
            <p className="text-[#7c5a5a] text-[15px] mt-1">
              Submit your business travel details for approval.
            </p>
          </div>

          {/* User Info Card */}
          <div className="flex items-center gap-4">
            <SignOutButton />
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_8px_16px_rgba(160,60,60,0.06)]">
              <div className="w-9 h-9 bg-white rounded-[10px] flex items-center justify-center border border-[rgba(255,200,200,0.5)]">
                <UserRound size={18} className="text-red-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold block">
                  {session?.user?.name ?? "Guest"}
                </span>
                <span className="text-[11px] text-[#a18080] block">
                  {session?.user?.email ?? "Not logged in"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-white/65 backdrop-blur-2xl border border-white/85 rounded-3xl p-10 shadow-[0_24px_48px_rgba(160,60,60,0.10)]">
          <form
            className="flex flex-col gap-10"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Section 1: Employee Details */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-rose-600 mb-5 flex items-center gap-2">
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
                  options={COST_CENTRES}
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
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-rose-600 mb-5 flex items-center gap-2">
                <MapPin size={16} /> Trip Information
              </h2>
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                <FormInput
                  label="Destination"
                  placeholder="City, Country"
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
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-rose-600 mb-5 flex items-center gap-2">
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
                <div className="flex flex-col gap-2 col-span-2 max-sm:col-span-1">
                  <label className="text-[13px] font-medium text-[#7c5a5a]">
                    Business Justification{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="h-25 px-3.5 py-3 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 text-sm outline-none resize-none font-sans transition-all duration-200 focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
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
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-rose-600 mb-5 flex items-center gap-2">
                <Wallet size={16} /> Estimated Costs (KES)
              </h2>
              <div className="grid grid-cols-4 gap-3.75 max-sm:grid-cols-1">
                <FormInput
                  type="number"
                  label="Transport (2-way)"
                  value={formData.transportCost}
                  onChange={(v) => updateField("transportCost", Number(v))}
                />
                <FormInput
                  type="number"
                  label="Accommodation"
                  value={formData.accommodationCost}
                  onChange={(v) => updateField("accommodationCost", Number(v))}
                />
                <FormInput
                  type="number"
                  label="Others/Misc"
                  value={formData.otherCost}
                  onChange={(v) => updateField("otherCost", Number(v))}
                />
                <FormInput
                  type="number"
                  label="Per Diem Policy"
                  value={formData.perDiem}
                  onChange={(v) => updateField("perDiem", Number(v))}
                />
              </div>

              <div className="mt-6 px-5 py-5 bg-linear-to-r from-rose-600 to-rose-400 rounded-2xl text-white flex justify-between items-center font-semibold shadow-[0_10px_20px_rgba(225,29,72,0.2)]">
                <span>Total Estimated Cost</span>
                <span className="text-2xl">
                  KES {totalCost.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={buttonDisabled}
              className="w-full py-4 bg-[#1e1b1b] text-white rounded-[14px] font-semibold cursor-pointer transition-all duration-200 border-none hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Submit Requisition
            </button>
            <p className="text-left text-xs">**All fields are required**</p>
          </form>
        </div>
      </div>
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
        className="h-10 px-3.5 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 text-sm outline-none transition-all duration-200 focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
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
    <div className="flex flex-col gap-2 relative">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className="h-10 px-3.5 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 text-sm outline-none transition-all duration-200 flex items-center justify-between cursor-pointer"
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
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-[rgba(240,180,180,0.6)] shadow-[0_10px_25px_rgba(160,60,60,0.1)] overflow-hidden p-1">
            {options.map((opt) => (
              <div
                key={opt}
                className="px-3 py-2.5 text-sm cursor-pointer rounded-lg text-[#1e1b1b] transition-all duration-200 hover:bg-rose-50 hover:text-rose-600"
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
