"use client";

import Image from "next/image";
import { useState } from "react";
import { assets, dateFormatter, initialsHelper } from "@/public/assets";
import {
  Building2,
  CalendarDays,
  Hash,
  MessageSquare,
  Clock,
  Check,
  X,
  Mail,
  UserRound,
  MapPin,
  Key,
} from "lucide-react";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import ApprovalAlert from "../TravelApprovers/ApprovalAlert";
import { UpdateAccessRequisitionStatus } from "@/serverActions/UpdateAccessRequisitionStatus";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessRequisitionData {
  uuid: string;
  stage: string;
  approverName: string;
  approverEmail: string;
  submitterName: string;
  submitterEmail: string;
  employeeName: string;
  employeeDepartment: string;
  employeeStaffNumber: string;
  issuanceDate: string;
  accessLocations: string;
  accessRequirements: string;
  requestCreatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stageLabel: Record<string, string> = {
  hod: "Head of Department",
  security: "Security Department",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
      {children}
    </p>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <span className="flex shrink-0 items-center gap-1.5 text-[#7c5a5a]">
        <Icon className="h-3.5 w-3.5 text-rose-400" />
        {label}
      </span>
      <span className="max-w-50 truncate text-right font-medium text-[#1e1b1b]">
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AccessApprovalModal = ({ data }: { data: AccessRequisitionData }) => {
  const {
    uuid,
    stage,
    approverName,
    approverEmail,
    submitterName,
    submitterEmail,
    employeeName,
    employeeDepartment,
    employeeStaffNumber,
    issuanceDate,
    accessLocations,
    accessRequirements,
    requestCreatedAt,
  } = data;

  const [comments, setComments] = useState("");
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [step, setStep] = useState(1);

  const roleLabel = stageLabel[stage] ?? "Approver";

  const handleApproval = async (status: "approved" | "declined") => {
    const setSubmitting = status === "approved" ? setApproving : setDeclining;
    setSubmitting(true);

    const commentsPayload =
      comments.trim() === "" ? "No comments" : comments.trim();

    try {
      const response = await UpdateAccessRequisitionStatus({
        uuid,
        stage,
        status,
        comments: commentsPayload,
        approverName,
        approverEmail,
      });

      setAlertInfo({
        alertType: response.alertType,
        alertMessage: response.alertMessage,
      });

      setComments("");
      setStep(2);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error while trying to update the status of this Access requisition",
          error,
        );
        setAlertInfo({ alertType: "error", alertMessage: error.toString() });
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative p-4">
      {(approving || declining) && <SubmittingOverlay />}

      {step === 2 && (
        <ApprovalAlert
          alertType={alertInfo.alertType}
          alertMessage={alertInfo.alertMessage}
        />
      )}

      {step === 1 && (
        <div className="relative z-10 mx-auto max-w-225">
          {/* Banner image */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.access_key_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center"
              priority
              alt="Access Request Form Image"
            />
          </div>

          {/* Page header */}
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              {roleLabel} Review
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Access Requisition - {employeeName}
            </h1>
            <p className="mt-1 text-[14px] text-[#7c5a5a]">
              Submitted {dateFormatter(requestCreatedAt)} · Pending your review
            </p>
          </div>

          {/* ── Card ── */}
          <div className="rounded-3xl border border-gray-100 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
            {/* Approver identity badge */}
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[13px] font-semibold text-rose-700">
                  {initialsHelper(approverName)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#1e1b1b]">
                    {approverName}
                  </p>
                  <p className="text-[12px] text-[#a18080]">{roleLabel}</p>
                </div>
              </div>
              <span className="rounded-lg bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
                Reviewing
              </span>
            </div>

            {/* ── Employee + Requisition Details ── */}
            <div className="mb-6 grid grid-cols-2 gap-8 max-sm:grid-cols-1">
              {/* Employee details */}
              <div>
                <SectionLabel>Employee Details</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  {/* Employee avatar row */}
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-800">
                      {initialsHelper(employeeName)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1e1b1b]">
                        {employeeName}
                      </p>
                      <p className="text-[11px] text-[#7c5a5a]">
                        {employeeDepartment}
                      </p>
                    </div>
                  </div>
                  <DetailRow
                    icon={Building2}
                    label="Department"
                    value={employeeDepartment}
                  />
                  <DetailRow
                    icon={Hash}
                    label="Staff No."
                    value={employeeStaffNumber}
                  />
                  <DetailRow
                    icon={Clock}
                    label="Submitted"
                    value={dateFormatter(requestCreatedAt)}
                  />
                  <DetailRow
                    icon={UserRound}
                    label="Requested By"
                    value={submitterName}
                  />
                  <DetailRow
                    icon={Mail}
                    label="Submitter Email"
                    value={submitterEmail}
                  />
                </div>
              </div>

              {/* Requisition info */}
              <div>
                <SectionLabel>Requisition Details</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <DetailRow
                    icon={CalendarDays}
                    label="Issuance Date"
                    value={dateFormatter(issuanceDate)}
                  />
                </div>
              </div>
            </div>

            {/* ── Access Requirements ── */}
            <div className="mb-6 grid grid-cols-2 gap-8 border-t border-[rgba(240,180,180,0.4)] pt-6 max-sm:grid-cols-1">
              {/* Locations */}
              <div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
                  <SectionLabel>Locations</SectionLabel>
                </div>

                <span className="px-5 py-1.5 text-[12px] font-medium wrap-break-word whitespace-pre-wrap text-slate-800">
                  {accessLocations}
                </span>
              </div>

              {/* Requirements */}
              <div>
                <div className="flex items-center gap-1.5">
                  <Key className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
                  <SectionLabel>Requirements / Justification</SectionLabel>
                </div>
                <span className="px-5 py-1.5 text-[12px] font-medium wrap-break-word whitespace-pre-wrap text-slate-800">
                  {accessRequirements}
                </span>
              </div>
            </div>

            {/* ── Approver Comments ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
                <SectionLabel>Comments</SectionLabel>
              </div>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="No comments"
                rows={4}
                className="w-full resize-none rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/70 px-4 py-3.5 text-[13px] leading-relaxed text-[#1e1b1b] transition-all duration-200 outline-none placeholder:text-[#c0a0a0] focus:border-rose-300 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.07)]"
              />
              <p className="mt-1.5 text-[11px] text-[#b0a0a0]">
                {comments.trim() === ""
                  ? "Add a comment if necessary"
                  : `${comments.trim().length} character${comments.trim().length > 1 ? "s" : ""}`}
              </p>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={declining || approving}
                onClick={() => handleApproval("declined")}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white/80 py-4 text-[14px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                {declining ? "Declining..." : "Decline"}
              </button>

              <button
                type="button"
                disabled={approving || declining}
                onClick={() => handleApproval("approved")}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                {approving ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-[12px] text-[#b0a0a0]">
            Your decision will be logged against your approval account
          </p>
        </div>
      )}
    </div>
  );
};

export default AccessApprovalModal;
