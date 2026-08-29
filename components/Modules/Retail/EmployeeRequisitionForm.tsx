"use client";

import { useState, ChangeEvent } from "react";
import { DatePicker } from "@/components/DatePicker";
import {
  UserRound,
  ArrowRight,
  Briefcase,
  Trash2,
  Plus,
  Paperclip,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadHodApprovers, loadBaseDepartments } from "@/lib/loadAppDataV2";
import {
  assets,
  REPLACEMENT_OR_NEW_OPTIONS,
  JOB_GRADES,
  getJobGradeNumber,
  EMPLOYEE_ATTACHMENT_TYPES,
  EMPLOYEE_ATTACHMENT_TYPE_LABELS,
  EmployeeAttachmentType,
} from "@/public/assets";
import { ApiFormHandler } from "@/utils/ApiHandler";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import AlertModal from "@/components/AlertModal";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import EmployeeConfirmationModal from "./EmployeeConfirmationModal";
import { useToggleStore } from "@/store/useToggleStore";
import { FormSelect } from "./CasualRequisitionForm";
import Image from "next/image";

// ---- Client-side attachment constraints (mirrors lib/attachmentStorage.ts) ----
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".pdf",
];
export const MAX_ATTACHMENT_BYTES_PER_FILE = 2 * 1024 * 1024; // 2MB

// ---- Types ----
export interface EmployeePositionFormData {
  clientId: string;
  title: string;
  numberRequired: number;
  replacementOrNew: string;
  jobGrade: string;
  salaryMin: number;
  salaryMax: number;
  justification: string;
  reportingTo: string;
  dateFilled: string;
  files: Partial<Record<EmployeeAttachmentType, File>>;
}

export interface EmployeeFormData {
  department: string;
  hodApprover: string;
  positions: EmployeePositionFormData[];
}

function EmptyPosition(): EmployeePositionFormData {
  return {
    clientId: crypto.randomUUID(),
    title: "",
    numberRequired: 1,
    replacementOrNew: "",
    jobGrade: "",
    salaryMin: 0,
    salaryMax: 0,
    justification: "",
    reportingTo: "",
    dateFilled: "",
    files: {},
  };
}

const InitialFormState: EmployeeFormData = {
  department: "",
  hodApprover: "",
  positions: [EmptyPosition()],
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function hasDisallowedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return !ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// ---- Main Page ----
export default function EmployeeRequisitionForm() {
  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);
  const triggerScroll = useToggleStore((state) => state.triggerScroll);

  const { data: DEPARTMENTS = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["BaseDepartmentsData"],
    queryFn: loadBaseDepartments,
  });

  const { data: HOD_APPROVERS = [], isLoading: hodsLoading } = useQuery({
    queryKey: ["BaseHodApproversData"],
    queryFn: loadHodApprovers,
  });

  const [formData, setFormData] = useState<EmployeeFormData>(InitialFormState);
  const [step, setStep] = useState(1);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const isEmpty = (val: unknown) =>
    val === null || val === undefined || val === "";

  const today = todayIsoDate();

  const positionsInvalid =
    formData.positions.length === 0 ||
    formData.positions.some((position) => {
      return (
        isEmpty(position.title) ||
        position.title.length > 100 ||
        isEmpty(position.justification) ||
        isEmpty(position.reportingTo) ||
        position.reportingTo.length > 100 ||
        isEmpty(position.dateFilled) ||
        position.dateFilled < today ||
        Number(position.numberRequired) < 1 ||
        isEmpty(position.replacementOrNew) ||
        isEmpty(position.jobGrade) ||
        Number(position.salaryMin) <= 0 ||
        Number(position.salaryMax) < Number(position.salaryMin) ||
        EMPLOYEE_ATTACHMENT_TYPES.some((type) => {
          const file = position.files[type];
          return (
            !file ||
            file.size > MAX_ATTACHMENT_BYTES_PER_FILE ||
            hasDisallowedExtension(file.name)
          );
        })
      );
    });

  const buttonDisabled =
    isEmpty(formData.department) ||
    isEmpty(formData.hodApprover) ||
    positionsInvalid;

  const updateField = <K extends keyof EmployeeFormData>(
    field: K,
    value: EmployeeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePositionField = <K extends keyof EmployeePositionFormData>(
    clientId: string,
    field: K,
    value: EmployeePositionFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map((p) =>
        p.clientId === clientId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const addPosition = () => {
    setFormData((prev) => ({
      ...prev,
      positions: [...prev.positions, EmptyPosition()],
    }));
  };

  const removePosition = (clientId: string) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.filter((p) => p.clientId !== clientId),
    }));
  };

  const fileErrorKey = (clientId: string, type: EmployeeAttachmentType) =>
    `${clientId}:${type}`;

  const handleFileChange = (
    clientId: string,
    type: EmployeeAttachmentType,
    fileList: FileList | null,
  ) => {
    const file = fileList?.[0];

    let error = "";
    if (file) {
      if (hasDisallowedExtension(file.name)) {
        error = "Only Word, Excel, and PDF documents are allowed";
      } else if (file.size > MAX_ATTACHMENT_BYTES_PER_FILE) {
        error = "Attachment must not exceed 2MB";
      }
    }

    setFileErrors((prev) => ({ ...prev, [fileErrorKey(clientId, type)]: error }));

    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map((p) =>
        p.clientId === clientId
          ? { ...p, files: { ...p.files, [type]: file } }
          : p,
      ),
    }));
  };

  const removeFile = (clientId: string, type: EmployeeAttachmentType) => {
    setFileErrors((prev) => ({ ...prev, [fileErrorKey(clientId, type)]: "" }));

    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map((p) => {
        if (p.clientId !== clientId) return p;
        const files = { ...p.files };
        delete files[type];
        return { ...p, files };
      }),
    }));
  };

  const handleSubmit = async () => {
    const payload = new FormData();

    payload.append(
      "metadata",
      JSON.stringify({
        department: formData.department,
        hodApprover: formData.hodApprover,
        positions: formData.positions.map((p) => ({
          title: p.title,
          numberRequired: Number(p.numberRequired),
          replacementOrNew: p.replacementOrNew,
          jobGrade: p.jobGrade,
          salaryMin: Number(p.salaryMin),
          salaryMax: Number(p.salaryMax),
          justification: p.justification,
          reportingTo: p.reportingTo,
          dateFilled: p.dateFilled,
        })),
      }),
    );

    formData.positions.forEach((position, index) => {
      EMPLOYEE_ATTACHMENT_TYPES.forEach((type) => {
        const file = position.files[type];
        if (file) payload.append(`positionFiles_${index}_${type}`, file);
      });
    });

    setSubmitting(true);

    try {
      const response = await ApiFormHandler(
        "/api/employeerequisition/submitrequisition",
        "POST",
        payload,
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.message ||
            "An error occurred while trying to submit your Employee requisition",
        );

      setAlertInfo({
        alertType: "success",
        alertMessage:
          data.message ||
          "Your Employee requisition has been submitted successfully, you will receive a confirmation email shortly",
      });

      setFormData(InitialFormState);
      setStep(3);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error while trying to submit Employee requisition",
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
        <EmployeeConfirmationModal
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
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.employee_form_image}
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
                Employee Requisition
              </h1>
              <p className="mt-1 text-[14px] text-[#7c5a5a]">
                Submit a request to fill one or more open positions.
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
                </div>
              </div>

              {/* Section 2: Positions */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
                    <Briefcase size={16} /> Positions
                  </h2>
                  <button
                    type="button"
                    onClick={addPosition}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Position
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  {formData.positions.map((position, index) => (
                    <PositionFieldset
                      key={position.clientId}
                      position={position}
                      index={index}
                      today={today}
                      showRemove={formData.positions.length > 1}
                      fileErrors={fileErrors}
                      onRemove={() => removePosition(position.clientId)}
                      onChange={(field, value) =>
                        updatePositionField(position.clientId, field, value)
                      }
                      onFileChange={(type, files) =>
                        handleFileChange(position.clientId, type, files)
                      }
                      onRemoveFile={(type) =>
                        removeFile(position.clientId, type)
                      }
                    />
                  ))}
                </div>

                {/* Add a position replicated at the bottom */}
                <button
                  type="button"
                  onClick={addPosition}
                  className="mt-4 flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Position
                </button>
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
                  All fields are required to proceed. Each position needs a
                  Job Description, KPIs, and Org Chart document (Word, Excel,
                  or PDF, max 2MB each).
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

function PositionFieldset({
  position,
  index,
  today,
  showRemove,
  fileErrors,
  onRemove,
  onChange,
  onFileChange,
  onRemoveFile,
}: {
  position: EmployeePositionFormData;
  index: number;
  today: string;
  showRemove: boolean;
  fileErrors: Record<string, string>;
  onRemove: () => void;
  onChange: <K extends keyof EmployeePositionFormData>(
    field: K,
    value: EmployeePositionFormData[K],
  ) => void;
  onFileChange: (
    type: EmployeeAttachmentType,
    files: FileList | null,
  ) => void;
  onRemoveFile: (type: EmployeeAttachmentType) => void;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#1e1b1b]">
          Position {index + 1}
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
            Position Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={position.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("title", e.target.value)
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Number Required <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={position.numberRequired || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("numberRequired", Number(e.target.value))
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Position Reporting To <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={position.reportingTo}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("reportingTo", e.target.value)
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Date Position Should Be Filled{" "}
            <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={position.dateFilled}
            onChange={(v) => onChange("dateFilled", v)}
            minDate={today}
          />
        </div>
        <FormSelect
          label="Replacement/New"
          options={[...REPLACEMENT_OR_NEW_OPTIONS]}
          value={position.replacementOrNew}
          onChange={(v) => onChange("replacementOrNew", v)}
        />
        <FormSelect
          label="Job Grade"
          options={[...JOB_GRADES]}
          value={position.jobGrade}
          onChange={(v) => onChange("jobGrade", v)}
          optionLabel={(grade) => `${getJobGradeNumber(grade)}. ${grade}`}
        />
        <span className="col-span-2 text-[13px] font-semibold text-rose-600">
          Salary Range (KES)
        </span>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Minimum Salary<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={position.salaryMin || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("salaryMin", Number(e.target.value))
            }
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#7c5a5a]">
            Maximum Salary<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="h-10 rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
            value={position.salaryMax || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange("salaryMax", Number(e.target.value))
            }
            required
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <label className="text-[13px] font-medium text-[#7c5a5a]">
          Position Justification <span className="text-red-500">*</span>
        </label>
        <textarea
          className="h-20 resize-none rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 py-3 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
          placeholder="Briefly describe why this position is being filled..."
          value={position.justification}
          required
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onChange("justification", e.target.value)
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <span className="text-[13px] font-medium text-[#7c5a5a]">
          Attachments <span className="text-red-500">*</span>
        </span>
        {EMPLOYEE_ATTACHMENT_TYPES.map((type) => {
          const file = position.files[type];
          const error = fileErrors[`${position.clientId}:${type}`];

          return (
            <div key={type} className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#7c5a5a]">
                {EMPLOYEE_ATTACHMENT_TYPE_LABELS[type]}{" "}
                <span className="text-red-500">*</span>
              </label>
              {file ? (
                <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-[12px] text-[#1e1b1b]">
                  <span className="max-w-70 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(type)}
                    className="cursor-pointer text-[#a18080] hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(240,180,180,0.8)] bg-white/60 px-3.5 py-4 text-[13px] font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50">
                  <Paperclip className="h-4 w-4" />
                  Upload Word, Excel, or PDF (Max 2MB)
                  <input
                    type="file"
                    accept=".doc,.docx,.xls,.xlsx,.pdf"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onFileChange(type, e.target.files)
                    }
                  />
                </label>
              )}
              {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
