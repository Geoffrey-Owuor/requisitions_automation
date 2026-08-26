"use client";

import { useState } from "react";
import {
  Building2,
  CalendarDays,
  Users,
  HardHat,
  Clock,
  Check,
  X,
  MessageSquareText,
  UserRound,
  Repeat,
  Layers,
  Wallet,
} from "lucide-react";
import { assets, dateFormatter, getJobGradeNumber } from "@/public/assets";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { UpdateEmployeeStatus } from "@/serverActions/UpdateEmployeeStatus";
import ApprovalAlert from "@/components/Approvers/TravelApprovers/ApprovalAlert";
import { initialsHelper } from "@/public/assets";
import Image from "next/image";
import AttachmentLink from "./AttachmentLink";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeApprovalAttachment {
  attachmentId: string;
  originalFilename: string;
}

export interface EmployeeApprovalPosition {
  positionId: string;
  positionTitle: string;
  numberRequired: number;
  replacementOrNew: string;
  jobGrade: string;
  salaryRange: string;
  justification: string;
  reportingTo: string;
  dateFilled: string;
  attachments: EmployeeApprovalAttachment[];
}

export interface EmployeeApprovalModalProps {
  uuid: string;
  stage: string;
  token: string;
  approverName: string;
  approverEmail: string;
  submitterName: string;
  submitterEmail: string;
  department: string;
  requestCreatedAt: string;
  positions: EmployeeApprovalPosition[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stageLabel: Record<string, string> = {
  hod: "Head of Department",
  director: "CEO",
  hr: "Human Resources",
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

const EmployeeApprovalModal = ({
  uuid,
  stage,
  token,
  approverName,
  approverEmail,
  submitterName,
  submitterEmail,
  department,
  requestCreatedAt,
  positions,
}: EmployeeApprovalModalProps) => {
  const [comments, setComments] = useState("");
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [step, setStep] = useState(1);

  const roleLabel = stageLabel[stage] ?? "Approver";

  const overallTotalRequired = positions.reduce(
    (sum, p) => sum + p.numberRequired,
    0,
  );

  // Approval/ decline function
  const handleApproval = async (status: string) => {
    const setSubmitting = status === "approved" ? setApproving : setDeclining;

    setSubmitting(true);

    const commentsPayload =
      comments.trim() === "" ? "No comments" : comments.trim();

    try {
      // Call our approval server action
      const response = await UpdateEmployeeStatus({
        uuid,
        stage,
        status,
        comments: commentsPayload,
        approverName,
        approverEmail,
      });

      // Set the alert info
      setAlertInfo({
        alertType: response.alertType,
        alertMessage: response.alertMessage,
      });

      // Reset comments
      setComments("");

      // Set the step
      setStep(2);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error while trying to update the status of this requisition",
          error,
        );
        const errorString = error.toString();
        setAlertInfo({ alertType: "error", alertMessage: errorString });

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
          {/* Form Image */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.employee_form_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center"
              priority
              alt="Form Image"
            />
          </div>
          {/* Page header */}
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              {roleLabel} Review
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Employee Requisition - {submitterName}
            </h1>
            <p className="mt-1 text-[14px] text-[#7c5a5a]">
              Submitted {dateFormatter(requestCreatedAt)} · Pending your review
            </p>
          </div>

          {/* ── Card ── */}
          <div className="rounded-3xl border border-gray-100 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
            {/* Approver identity badge */}
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/80 px-4 py-3">
              <div className="flex items-center gap-3">
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

            {/* ── Submitter + Requisition details ── */}
            <div className="mb-6 grid grid-cols-2 gap-8 max-sm:grid-cols-1">
              {/* Submitter details */}
              <div>
                <SectionLabel>Submitter Details</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-800">
                      {initialsHelper(submitterName)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1e1b1b]">
                        {submitterName}
                      </p>
                      <p className="text-[11px] text-[#7c5a5a]">
                        {submitterEmail}
                      </p>
                    </div>
                  </div>
                  <DetailRow
                    icon={Building2}
                    label="Department"
                    value={department}
                  />
                  <DetailRow
                    icon={Clock}
                    label="Submitted"
                    value={dateFormatter(requestCreatedAt)}
                  />
                </div>
              </div>

              {/* Requisition info */}
              <div>
                <SectionLabel>Requisition Information</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <DetailRow
                    icon={UserRound}
                    label="Positions"
                    value={String(positions.length)}
                  />
                  <DetailRow
                    icon={Users}
                    label="Total Number Required"
                    value={String(overallTotalRequired)}
                  />
                </div>
              </div>
            </div>

            {/* ── Positions ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <SectionLabel>Positions</SectionLabel>
              <div className="flex flex-col gap-4">
                {positions.map((position) => (
                  <div
                    key={position.positionId}
                    className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 p-5"
                  >
                    <h3 className="mb-3 text-[13px] font-semibold text-[#1e1b1b]">
                      {position.positionTitle}
                    </h3>

                    <div className="mb-3 grid grid-cols-2 gap-3 text-[13px] max-sm:grid-cols-1">
                      <DetailRow
                        icon={Users}
                        label="Number Required"
                        value={String(position.numberRequired)}
                      />
                      <DetailRow
                        icon={UserRound}
                        label="Reporting To"
                        value={position.reportingTo}
                      />
                      <DetailRow
                        icon={CalendarDays}
                        label="Date To Be Filled"
                        value={dateFormatter(position.dateFilled)}
                      />
                      <DetailRow
                        icon={Repeat}
                        label="Replacement/New"
                        value={position.replacementOrNew}
                      />
                      <DetailRow
                        icon={Layers}
                        label="Job Grade"
                        value={`${position.jobGrade} (Grade ${getJobGradeNumber(position.jobGrade)})`}
                      />
                      <DetailRow
                        icon={Wallet}
                        label="Salary Range (KES)"
                        value={position.salaryRange}
                      />
                    </div>

                    <div className="mb-4">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                        <HardHat className="h-3.5 w-3.5 text-rose-400" />
                        Justification
                      </p>
                      <p className="rounded-xl border border-[rgba(240,180,180,0.3)] bg-white/70 px-4 py-3 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                        {position.justification}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                        Attachments
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {position.attachments.map((attachment) => (
                          <AttachmentLink
                            key={attachment.attachmentId}
                            attachmentId={attachment.attachmentId}
                            label={attachment.originalFilename}
                            queryString={`token=${token}&stage=${stage}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Approver Comments ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <div className="flex items-center gap-1.5">
                <MessageSquareText className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
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
              {/* Decline */}
              <button
                type="button"
                disabled={declining}
                onClick={() => handleApproval("declined")}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white/80 py-4 text-[14px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                {declining ? "Declining..." : "Decline"}
              </button>

              {/* Approve */}
              <button
                type="button"
                disabled={approving}
                onClick={() => handleApproval("approved")}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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

export default EmployeeApprovalModal;
