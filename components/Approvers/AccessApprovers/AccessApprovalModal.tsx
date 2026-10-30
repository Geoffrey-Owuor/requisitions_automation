"use client";

import { FormBanner } from "@/components/FormBanner";
import { useState } from "react";
import {
  dateFormatter,
  initialsHelper,
  ACCESS_STAGE_LABELS,
} from "@/public/assets";
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
  BadgeCheck,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import ApprovalAlert from "../TravelApprovers/ApprovalAlert";
import { UpdateAccessRequisitionStatus } from "@/serverActions/UpdateAccessRequisitionStatus";
import {
  ACCESS_LOCATIONS_LABEL,
  ACCESS_REQUIREMENTS_LABEL,
  getAccessPolicy,
} from "@/lib/accessRequisition";
import AccessPolicyConditions from "./AccessPolicyConditions";
import PreviousApprovalsSection, {
  PreviousApproval,
} from "@/components/Approvers/PreviousApprovalsSection";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessRequisitionData {
  uuid: string;
  stage: string;
  approverName: string;
  // Approval token from the emailed link - the server resolves the acting
  // approver from it (lib/approverToken.ts)
  token: string;
  submitterName: string;
  submitterEmail: string;
  employeeName: string;
  employeeDepartment: string;
  employeeStaffNumber: string;
  employeeStatus: string;
  issuanceDate: string;
  accessLocations: string;
  accessRequirements: string;
  // The policy version the submitter agreed to, and when
  termsVersion: number;
  termsAcceptedAt: string;
  requestCreatedAt: string;
  previousApprovals: PreviousApproval[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stageLabel = ACCESS_STAGE_LABELS;

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
      <span className="min-w-0 text-right font-medium wrap-break-word text-[#1e1b1b]">
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
    token,
    submitterName,
    submitterEmail,
    employeeName,
    employeeDepartment,
    employeeStaffNumber,
    employeeStatus,
    issuanceDate,
    accessLocations,
    accessRequirements,
    termsVersion,
    termsAcceptedAt,
    requestCreatedAt,
    previousApprovals,
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
  const policy = getAccessPolicy(termsVersion);

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
        token,
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
          <FormBanner type="access" />

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
          <div className="rounded-surface border border-gray-100 bg-white px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] sm:px-8">
            {/* Approver identity badge */}
            <div className="rounded-surface mb-7 flex flex-wrap items-center justify-between gap-3 border border-[rgba(240,180,180,0.5)] bg-white px-4 py-3">
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
              <span className="rounded-compact bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
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
                    icon={BadgeCheck}
                    label="Employee Status"
                    value={employeeStatus}
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
                  <SectionLabel>{ACCESS_LOCATIONS_LABEL}</SectionLabel>
                </div>

                <span className="px-5 py-1.5 text-[12px] font-medium wrap-break-word whitespace-pre-wrap text-slate-800">
                  {accessLocations}
                </span>
              </div>

              {/* Requirements */}
              <div>
                <div className="flex items-center gap-1.5">
                  <Key className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
                  <SectionLabel>{ACCESS_REQUIREMENTS_LABEL}</SectionLabel>
                </div>
                <span className="px-5 py-1.5 text-[12px] font-medium wrap-break-word whitespace-pre-wrap text-slate-800">
                  {accessRequirements}
                </span>
              </div>
            </div>

            {/* ── Key Custody & Access Policy ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
                <SectionLabel>Key Custody & Access Policy</SectionLabel>
              </div>
              <p className="flex items-start gap-2 text-[13px] text-[#1e1b1b]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Acknowledged by <strong>{submitterName}</strong> when
                  submitting on {dateFormatter(termsAcceptedAt)}.
                </span>
              </p>
              <details className="group rounded-control mt-3 border border-[rgba(240,180,180,0.5)] bg-rose-50/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-[#7c5a5a] [&::-webkit-details-marker]:hidden">
                  View the policy and acknowledgement
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4">
                  <AccessPolicyConditions policy={policy} />
                  <p className="mt-4 border-t border-[rgba(240,180,180,0.4)] pt-3 text-[13px] leading-relaxed text-[#5c4a4a] italic">
                    &ldquo;{policy.acknowledgement}&rdquo;
                  </p>
                </div>
              </details>
            </div>

            {/* ── Previous Approvals ── */}
            <PreviousApprovalsSection approvals={previousApprovals} />

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
                className="rounded-surface w-full resize-none border border-[rgba(240,180,180,0.5)] bg-white px-4 py-3.5 text-[13px] leading-relaxed text-[#1e1b1b] transition-all duration-200 outline-none placeholder:text-[#c0a0a0] focus:border-rose-300 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.07)]"
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
                className="rounded-control flex flex-1 cursor-pointer items-center justify-center gap-2 border border-rose-200 bg-white py-4 text-[14px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                {declining ? "Declining..." : "Decline"}
              </button>

              <button
                type="button"
                disabled={approving || declining}
                onClick={() => handleApproval("approved")}
                className="rounded-control flex flex-1 cursor-pointer items-center justify-center gap-2 border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98]"
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
