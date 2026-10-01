"use client";

import Image from "next/image";
import { useState } from "react";
import { assets, TRAVEL_STAGE_LABELS } from "@/public/assets";
import {
  Building2,
  MapPin,
  CalendarDays,
  PlaneTakeoff,
  BadgeDollarSign,
  CircleDollarSign,
  Wallet,
  TrendingUp,
  Tag,
  ShieldCheck,
  Clock,
  Layers,
  Check,
  X,
  MessageSquareText,
  Undo2,
} from "lucide-react";
import { dateFormatter } from "@/public/assets";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { UpdateTravelStatus } from "@/serverActions/UpdateTravelStatus";
import ApprovalAlert from "./ApprovalAlert";
import { initialsHelper } from "@/public/assets";
import EngineeringJobSummaryCard from "./EngineeringJobSummaryCard";
import PreviousApprovalsSection, {
  PreviousApproval,
} from "@/components/Approvers/PreviousApprovalsSection";
import TravelPushbackHistory from "./TravelPushbackHistory";
import TravelAmendmentHistory from "./TravelAmendmentHistory";
import { TravelAmendmentValues } from "@/lib/travelAmendment";
import { PushbackTravelHrDecision } from "@/serverActions/PushbackTravelHrDecision";
import {
  MAX_PUSHBACK_REASON_LENGTH,
  MAX_TRAVEL_HR_PUSHBACKS,
  oppositeHrStatus,
  TravelPushbackValues,
} from "@/lib/travelPushback";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TravelApprovalModalProps {
  uuid: string;
  stage: string;
  approverName: string;
  approverEmail: string;
  employeeName: string;
  employeeDepartment: string;
  employeeDesignation: string;
  travelDestination: string;
  travelDepartureDate: string;
  travelReturnDate: string;
  travelCategory: string;
  travelBusinessJustification: string;
  travelMode: string;
  travelTransportCost: number;
  travelOtherCosts: number;
  travelPerDiem: number;
  travelTotalCost: number;
  travelCostCenter: string;
  travelWithinBudget: string;
  travelApprovalTier: string;
  requestCreatedAt: string;
  engineeringJobs: string;
  previousApprovals: PreviousApproval[];
  pushbacks: TravelPushbackValues[];
  amendments: TravelAmendmentValues[];
  amendmentCount: number;
  // Set when HR is reversing its own recorded decision (mode=pushback)
  pushback?: {
    token: string;
    currentStatus: string;
    currentApprover: string;
    currentComments: string;
    pushbackCount: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stageLabel = TRAVEL_STAGE_LABELS;

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

const TravelApprovalModal = ({
  uuid,
  stage,
  approverName,
  approverEmail,
  employeeName,
  employeeDepartment,
  employeeDesignation,
  travelDestination,
  travelDepartureDate,
  travelReturnDate,
  travelCategory,
  travelBusinessJustification,
  travelMode,
  travelTransportCost,
  travelOtherCosts,
  travelPerDiem,
  travelTotalCost,
  travelCostCenter,
  travelWithinBudget,
  travelApprovalTier,
  requestCreatedAt,
  engineeringJobs,
  previousApprovals,
  pushbacks,
  amendments,
  amendmentCount,
  pushback,
}: TravelApprovalModalProps) => {
  const [comments, setComments] = useState("");
  const [reason, setReason] = useState("");
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertType: "",
    alertMessage: "",
  });
  const [step, setStep] = useState(1);

  const roleLabel = stageLabel[stage] ?? "Approver";

  // Approval/ decline function
  const handleApproval = async (status: string) => {
    const setSubmitting = status === "approved" ? setApproving : setDeclining;

    setSubmitting(true);

    const commentsPayload =
      comments.trim() === "" ? "No comments" : comments.trim();

    try {
      // Call our approval (or push-back) server action
      const response = pushback
        ? await PushbackTravelHrDecision({
            uuid,
            token: pushback.token,
            status,
            comments: commentsPayload,
            reason,
            expectedPushbackCount: pushback.pushbackCount,
            expectedAmendmentCount: amendmentCount,
          })
        : await UpdateTravelStatus({
            uuid,
            stage,
            status,
            comments: commentsPayload,
            approverName,
            approverEmail,
            expectedAmendmentCount: amendmentCount,
          });

      // Set the alert info
      setAlertInfo({
        alertType: response.alertType,
        alertMessage: response.alertMessage,
      });

      // Reset comments
      setComments("");
      setReason("");

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
          {/* Banner image */}
          <div className="mb-4 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={assets.form_image}
              sizes="100vh"
              className="rounded-xl object-contain object-center" // or "object-cover" depending on your needs
              priority // Use this if the image is above the fold
              alt="Form Image"
            />
          </div>

          {/* Page header */}
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              {roleLabel} {pushback ? "Push-back" : "Review"}
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Travel Requisition - {employeeName}
            </h1>
            <p className="mt-1 text-[14px] text-[#7c5a5a]">
              Submitted {dateFormatter(requestCreatedAt)} ·{" "}
              {pushback
                ? `Pushing back the recorded HR decision (${pushback.pushbackCount + 1} of ${MAX_TRAVEL_HR_PUSHBACKS})`
                : "Pending your review"}
            </p>
          </div>

          {/* ── Card ── */}
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] sm:px-8">
            {/* Approver identity badge */}
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white px-4 py-3">
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
                {pushback ? "Pushing back" : "Reviewing"}
              </span>
            </div>

            {/* ── Employee + Trip details ── */}
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
                        {employeeDesignation}
                      </p>
                    </div>
                  </div>
                  <DetailRow
                    icon={Building2}
                    label="Department"
                    value={employeeDepartment}
                  />
                  <DetailRow
                    icon={Tag}
                    label="Cost Centre"
                    value={travelCostCenter}
                  />
                  <DetailRow
                    icon={Clock}
                    label="Submitted"
                    value={dateFormatter(requestCreatedAt)}
                  />
                </div>
              </div>

              {/* Trip info */}
              <div>
                <SectionLabel>Trip Information</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <DetailRow
                    icon={MapPin}
                    label="Destination"
                    value={travelDestination}
                  />
                  <DetailRow
                    icon={CalendarDays}
                    label="Departure"
                    value={dateFormatter(travelDepartureDate)}
                  />
                  <DetailRow
                    icon={CalendarDays}
                    label="Return"
                    value={dateFormatter(travelReturnDate)}
                  />
                  <DetailRow
                    icon={Layers}
                    label="Category"
                    value={travelCategory}
                  />
                  <DetailRow
                    icon={PlaneTakeoff}
                    label="Travel Mode"
                    value={travelMode}
                  />
                  <DetailRow
                    icon={ShieldCheck}
                    label="Within Budget?"
                    value={travelWithinBudget}
                  />
                </div>
              </div>
            </div>

            {/* ── Business Justification ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <SectionLabel>Business Justification</SectionLabel>
              <p className="rounded-xl border border-[rgba(240,180,180,0.3)] bg-white px-4 py-3.5 text-[13px] leading-relaxed text-[#1e1b1b]">
                {travelBusinessJustification}
              </p>
            </div>

            {/* ── Cost Breakdown ── */}
            <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
              <SectionLabel>Cost Breakdown (KES)</SectionLabel>
              <div className="mb-3 grid grid-cols-3 gap-2 max-sm:grid-cols-2">
                {[
                  {
                    label: "Transport",
                    value: travelTransportCost,
                    Icon: PlaneTakeoff,
                  },
                  { label: "Others", value: travelOtherCosts, Icon: Wallet },
                  {
                    label: "Per Diem",
                    value: travelPerDiem,
                    Icon: CircleDollarSign,
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

              {/* Showing the engineering jobs area */}
              {employeeDepartment === "Engineering & HVAC" && (
                <EngineeringJobSummaryCard jobDetailsString={engineeringJobs} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-wrap items-center justify-between rounded-2xl bg-linear-to-r from-slate-800 to-rose-900 px-5 py-4 text-white">
                  <div className="flex items-center gap-1.5">
                    <BadgeDollarSign className="h-4 w-4 text-white/60" />
                    <span className="text-[13px] text-white/70">Total</span>
                  </div>
                  <span className="text-[16px] font-semibold">
                    KES {travelTotalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between rounded-2xl bg-rose-800 px-5 py-4 text-rose-50">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-rose-300" />
                    <span className="text-[13px] text-rose-200">
                      Approval Tier
                    </span>
                  </div>
                  <span className="text-[16px] font-semibold">
                    {travelApprovalTier}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Previous Approvals ── */}
            <PreviousApprovalsSection
              approvals={
                pushback
                  ? [
                      ...previousApprovals,
                      {
                        label: `${stageLabel.hr} (current decision)`,
                        approverName: pushback.currentApprover,
                        status: pushback.currentStatus,
                        comments: pushback.currentComments,
                      },
                    ]
                  : previousApprovals
              }
            />

            {/* ── Amendment History ── */}
            <TravelAmendmentHistory amendments={amendments} />

            {/* ── HR Push-back History ── */}
            <TravelPushbackHistory pushbacks={pushbacks} />

            {/* ── Push-back Reason (push-back mode only) ── */}
            {pushback && (
              <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
                <div className="flex items-center gap-1.5">
                  <Undo2 className="mb-2.5 h-3.5 w-3.5 text-amber-500" />
                  <SectionLabel>Push-back Reason (required)</SectionLabel>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={MAX_PUSHBACK_REASON_LENGTH}
                  placeholder="Why is the HR decision being changed?"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-amber-300 bg-white px-4 py-3.5 text-[13px] leading-relaxed text-[#1e1b1b] transition-all duration-200 outline-none placeholder:text-[#c0a0a0] focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]"
                />
                <p className="mt-1.5 text-[11px] text-[#b0a0a0]">
                  {reason.trim() === ""
                    ? "A reason is required to push back this decision"
                    : `${reason.trim().length} / ${MAX_PUSHBACK_REASON_LENGTH} characters`}
                </p>
              </div>
            )}

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
                className="w-full resize-none rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white px-4 py-3.5 text-[13px] leading-relaxed text-[#1e1b1b] transition-all duration-200 outline-none placeholder:text-[#c0a0a0] focus:border-rose-300 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.07)]"
              />
              <p className="mt-1.5 text-[11px] text-[#b0a0a0]">
                {comments.trim() === ""
                  ? "Add a comment if necessary"
                  : `${comments.trim().length} character${comments.trim().length > 1 ? "s" : ""}`}
              </p>
            </div>

            {/* ── Actions ── */}
            {pushback ? (
              // A push-back must flip the decision, so only the opposite
              // decision is offered.
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={approving || declining || reason.trim() === ""}
                  onClick={() =>
                    handleApproval(oppositeHrStatus(pushback.currentStatus))
                  }
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {oppositeHrStatus(pushback.currentStatus) === "approved" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {approving || declining
                    ? "Submitting..."
                    : `Push back to ${oppositeHrStatus(pushback.currentStatus) === "approved" ? "Approved" : "Declined"}`}
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-1">
                {/* Decline */}
                <button
                  type="button"
                  disabled={declining}
                  onClick={() => handleApproval("declined")}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white py-4 text-[14px] font-semibold text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98]"
                >
                  <X className="h-4 w-4" />
                  {declining ? "Declining..." : "Decline"}
                </button>

                {/* Approve */}
                <button
                  type="button"
                  disabled={approving}
                  onClick={() => handleApproval("approved")}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-slate-900 py-4 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  {approving ? "Approving..." : "Approve"}
                </button>
              </div>
            )}
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

export default TravelApprovalModal;
