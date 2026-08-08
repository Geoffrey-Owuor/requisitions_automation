"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  CalendarDays,
  Users,
  HardHat,
  Wallet,
  BadgeDollarSign,
  Clock,
  Check,
  X,
  MessageSquareText,
} from "lucide-react";
import { assets, dateFormatter } from "@/public/assets";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import {
  UpdateCasualStatus,
  HrSectionApproval,
} from "@/serverActions/UpdateCasualStatus";
import ApprovalAlert from "@/components/Approvers/TravelApprovers/ApprovalAlert";
import { initialsHelper } from "@/public/assets";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CasualApprovalSection {
  sectionId: string;
  sectionName: string;
  justification: string;
  numberOfCasuals: number;
  ppesRequired: string;
  periodFrom: string;
  periodTo: string;
  engagementDays: number;
  ratePerDay: number;
  totalAmount: number;
}

export interface CasualApprovalModalProps {
  uuid: string;
  stage: string;
  approverName: string;
  approverEmail: string;
  submitterName: string;
  submitterEmail: string;
  department: string;
  location: string;
  requestCreatedAt: string;
  sections: CasualApprovalSection[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stageLabel: Record<string, string> = {
  hod: "Head of Department",
  finance: "Finance",
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

const CasualApprovalModal = ({
  uuid,
  stage,
  approverName,
  approverEmail,
  submitterName,
  submitterEmail,
  department,
  location,
  requestCreatedAt,
  sections,
}: CasualApprovalModalProps) => {
  const [comments, setComments] = useState("");
  const [hrApprovedCasuals, setHrApprovedCasuals] = useState<
    Record<string, number | "">
  >(
    Object.fromEntries(
      sections.map((section) => [section.sectionId, section.numberOfCasuals]),
    ),
  );
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [step, setStep] = useState(1);

  const roleLabel = stageLabel[stage] ?? "Approver";
  const isHrStage = stage === "hr";
  const hrApprovalInvalid =
    isHrStage &&
    sections.some((section) => {
      const value = hrApprovedCasuals[section.sectionId];
      return value === "" || value < 0;
    });

  const overallTotalAmount = sections.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  );
  const overallTotalCasuals = sections.reduce(
    (sum, s) => sum + s.numberOfCasuals,
    0,
  );

  // Approval/ decline function
  const handleApproval = async (status: string) => {
    const setSubmitting = status === "approved" ? setApproving : setDeclining;

    setSubmitting(true);

    const commentsPayload =
      comments.trim() === "" ? "No comments" : comments.trim();

    const hrPayload: HrSectionApproval[] | undefined =
      isHrStage && status === "approved"
        ? sections.map((section) => ({
            sectionId: section.sectionId,
            approvedCasuals: Number(hrApprovedCasuals[section.sectionId]),
          }))
        : undefined;

    try {
      // Call our approval server action
      const response = await UpdateCasualStatus({
        uuid,
        stage,
        status,
        comments: commentsPayload,
        approverName,
        approverEmail,
        hrApprovedCasuals: hrPayload,
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
          {/* Page header */}
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              {roleLabel} Review
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Casual Requisition - {submitterName}
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
                  <DetailRow icon={MapPin} label="Location" value={location} />
                  <DetailRow
                    icon={Users}
                    label="Sections"
                    value={String(sections.length)}
                  />
                  <DetailRow
                    icon={Users}
                    label="Total Casuals"
                    value={String(overallTotalCasuals)}
                  />
                </div>
              </div>
            </div>

            {/* ── Sections ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <SectionLabel>Sections</SectionLabel>
              <div className="flex flex-col gap-4">
                {sections.map((section) => (
                  <div
                    key={section.sectionId}
                    className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 p-5"
                  >
                    <h3 className="mb-3 text-[13px] font-semibold text-[#1e1b1b]">
                      {section.sectionName}
                    </h3>

                    <div className="mb-3 grid grid-cols-2 gap-3 text-[13px] max-sm:grid-cols-1">
                      <DetailRow
                        icon={CalendarDays}
                        label="Period From"
                        value={dateFormatter(section.periodFrom)}
                      />
                      <DetailRow
                        icon={CalendarDays}
                        label="Period To"
                        value={dateFormatter(section.periodTo)}
                      />
                      <DetailRow
                        icon={Users}
                        label="Number of Casuals"
                        value={String(section.numberOfCasuals)}
                      />
                    </div>

                    <div className="mb-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                        <HardHat className="h-3.5 w-3.5 text-rose-400" />
                        Justification
                      </p>
                      <p className="rounded-xl border border-[rgba(240,180,180,0.3)] bg-white/70 px-4 py-3 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                        {section.justification}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="mb-1 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                        PPEs Required
                      </p>
                      <p className="rounded-xl border border-[rgba(240,180,180,0.3)] bg-white/70 px-4 py-3 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                        {section.ppesRequired}
                      </p>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 max-sm:grid-cols-2">
                      {[
                        {
                          label: "Rate / Day",
                          value: section.ratePerDay,
                          Icon: Wallet,
                        },
                        {
                          label: "Engagement Days",
                          value: section.engagementDays,
                          Icon: CalendarDays,
                        },
                        {
                          label: "Casuals",
                          value: section.numberOfCasuals,
                          Icon: Users,
                        },
                      ].map(({ label, value, Icon }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center"
                        >
                          <Icon className="mx-auto mb-1 h-4 w-4 text-rose-400" />
                          <p className="text-[11px] text-[#7c5a5a]">{label}</p>
                          <p className="mt-0.5 text-[15px] font-semibold text-[#1e1b1b]">
                            {value.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-4 text-white">
                      <div className="flex items-center gap-1.5">
                        <BadgeDollarSign className="h-4 w-4 text-white/60" />
                        <span className="text-[13px] text-white/70">
                          Section Total
                        </span>
                      </div>
                      <span className="text-[16px] font-semibold">
                        KES {section.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* ── HR: Approved Number of Casuals (per section) ── */}
                    {isHrStage && (
                      <div className="mt-4 border-t border-[rgba(240,180,180,0.4)] pt-4">
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                          Approved Number of Casuals *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={hrApprovedCasuals[section.sectionId]}
                          onChange={(e) =>
                            setHrApprovedCasuals((prev) => ({
                              ...prev,
                              [section.sectionId]:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]"
                          required
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Overall Summary ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <SectionLabel>Overall Summary</SectionLabel>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-rose-700/30 bg-linear-to-r from-rose-900/80 to-rose-800/80 px-5 py-5 font-semibold text-rose-50">
                  <span>Total Casuals</span>
                  <span className="text-xl">{overallTotalCasuals}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-5 font-semibold text-white shadow-lg">
                  <span>Total Amount</span>
                  <span className="text-xl">
                    KES {overallTotalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              {isHrStage && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Final total casual headcount per section can be changed in the
                  HR stage. Each section&apos;s total amount will be
                  recalculated using its approved headcount.
                </p>
              )}
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
                disabled={approving || hrApprovalInvalid}
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

export default CasualApprovalModal;
