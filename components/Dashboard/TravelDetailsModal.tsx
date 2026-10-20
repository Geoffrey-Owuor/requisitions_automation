"use client";
import {
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle2,
  MessageSquare,
  LucideIcon,
  UserRound,
  ArrowUpRight,
  Workflow,
  BriefcaseBusiness,
  ShieldUser,
  Undo2,
  Pencil,
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "./StatusFormatter";
import { dateFormatter } from "@/public/assets";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getTravelApproverLink } from "@/serverActions/GetTravelApproverLink";
import { amendRequisitionHref } from "@/lib/dashboardTables";
import { useQuery } from "@tanstack/react-query";
import { getTravelAuditTrail } from "@/serverActions/GetTravelAuditTrail";
import { Modal, ModalActionSkeleton, modalActionClass } from "../Modal";
import { getTravelPushbackBlocker } from "@/lib/travelPushback";
import { getTravelAmendmentBlocker } from "@/lib/travelAmendment";
import TravelPushbackHistory from "@/components/Approvers/TravelApprovers/TravelPushbackHistory";
import TravelAmendmentHistory from "@/components/Approvers/TravelApprovers/TravelAmendmentHistory";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag:
    | "userData"
    | "hodPending"
    | "hrPending"
    | "directorPending"
    | "history";
  onClose: () => void;
}

export type TravelStageLevels = "hod" | "hr" | "director" | "user";

export const TravelDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const { memberships } = useUser();

  // Get token based on the data flag

  const STAGE_LEVELS: Record<typeof dataFlag, TravelStageLevels> = {
    hodPending: "hod",
    hrPending: "hr",
    directorPending: "director",
    userData: "user", // We have to make sure this is never used as it it not yet available in our data
    history: "user", // Read-only — approvals happen from the pending tables
  };

  const stage = STAGE_LEVELS[dataFlag];
  const requestId: string | undefined = data?.request_id;

  // Only resolved when the viewer is at a pending approval stage
  const needsReviewLink =
    stage !== "user" && data?.[`travel_${stage}_approval_status`] === "pending";
  const linkQuery = useQuery({
    queryKey: ["travelApproverLink", stage, requestId],
    queryFn: () => getTravelApproverLink({ stage, uuid: requestId! }),
    enabled: isOpen && needsReviewLink,
  });

  // HR push-back is offered from the read-only history table to travel-HR
  // members. This only decides whether to show the button - the approval
  // page and PushbackTravelHrDecision re-check every rule.
  const canPushback =
    !!data &&
    dataFlag === "history" &&
    memberships.hrForms.includes("travel") &&
    getTravelPushbackBlocker({
      hrStatus: data.travel_hr_approval_status,
      approvalTier: data.travel_approval_tier,
      pushbackCount: data.travel_hr_pushback_count,
      withinWindow: data.within_pushback_window,
    }) === null;

  const pushbackLinkQuery = useQuery({
    queryKey: ["travelPushbackLink", requestId],
    queryFn: () =>
      getTravelApproverLink({
        stage: "hr",
        uuid: requestId!,
        mode: "pushback",
      }),
    enabled: isOpen && canPushback,
  });

  // Only the submitter's own table offers Amend. This only decides whether to
  // show the button - the amend form and the amendment route re-check it.
  const canAmend =
    !!data &&
    dataFlag === "userData" &&
    getTravelAmendmentBlocker({
      hrStatus: data.travel_hr_approval_status,
      withinWindow: data.within_pushback_window,
    }) === null;

  // Only fetch the history when the requisition has actually been pushed
  // back or amended. Refetched on every open (staleTime 0).
  const hasAuditTrail =
    !!data &&
    (Number(data.travel_hr_pushback_count) > 0 ||
      Number(data.amendment_count) > 0);
  const auditTrailQuery = useQuery({
    queryKey: ["travelAuditTrail", requestId],
    queryFn: () => getTravelAuditTrail(requestId!),
    enabled: isOpen && hasAuditTrail,
    staleTime: 0,
  });
  const pushbacks = auditTrailQuery.data?.pushbacks ?? [];
  const amendments = auditTrailQuery.data?.amendments ?? [];

  if (!data) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={<BriefcaseBusiness size={18} className="text-red-400" />}
      title="Travel Requisition"
      subtitle={
        <>
          ID: {data.request_id} &middot;{" "}
          {dateFormatter(data.request_created_at)}
        </>
      }
      actions={
        <>
          {canAmend && (
            <Link
              href={amendRequisitionHref("travel", data.request_id)}
              onClick={onClose}
              className={modalActionClass.amber}
            >
              <Pencil className="h-3.5 w-3.5" />
              Amend
            </Link>
          )}
          {needsReviewLink &&
            (linkQuery.isPending ? (
              <ModalActionSkeleton />
            ) : (
              linkQuery.data && (
                <Link
                  href={linkQuery.data}
                  onClick={onClose}
                  className={modalActionClass.dark}
                >
                  <ShieldUser className="h-3.5 w-3.5" />
                  Review
                </Link>
              )
            ))}
          {canPushback && pushbackLinkQuery.data && (
            <Link
              href={pushbackLinkQuery.data}
              onClick={onClose}
              title="Change the recorded HR decision on this requisition"
              className={modalActionClass.amber}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Push-back
            </Link>
          )}
          <Link
            href={`/dashboard/travelpdf/${data.request_id}`}
            onClick={onClose}
            className={modalActionClass.dark}
          >
            Pdf
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailItem
          icon={UserRound}
          label="Employee"
          value={data.employee_name}
        />
        <DetailItem
          icon={MapPin}
          label="Destination"
          value={data.travel_destination}
        />
        <DetailItem
          icon={Calendar}
          label="Departure"
          value={dateFormatter(data.travel_departure_date)}
        />
        <DetailItem
          icon={Calendar}
          label="Return"
          value={dateFormatter(data.travel_return_date)}
        />
        <DetailItem
          icon={CreditCard}
          label="Total Budget"
          value={`KES ${data.travel_total_cost}`}
        />
        <DetailItem
          icon={CheckCircle2}
          label="Cost Center"
          value={data.travel_cost_center}
        />

        <div className="rounded-surface col-span-full mt-4 bg-neutral-50 p-4 text-black">
          <div className="mb-2 flex items-center gap-2 text-rose-400">
            <MessageSquare size={16} className="text-rose-500" />
            <span className="text-xs font-bold tracking-tighter uppercase">
              Business Justification
            </span>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            {data.travel_business_justification}
          </p>
        </div>

        {/* Approvals Section */}
        <div className="col-span-full mt-6">
          <div className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-800">
            <Workflow size={16} />
            Approval Chain
          </div>
          <div className="space-y-3">
            {[
              {
                label: "HOD",
                status: data.travel_hod_approval_status,
                comment: data.travel_hod_comments,
              },
              {
                label: "HR",
                status: data.travel_hr_approval_status,
                comment: data.travel_hr_comments,
              },
              {
                label: "Director",
                status: data.travel_director_approval_status,
                comment: data.travel_director_comments,
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="rounded-control flex items-center justify-between bg-neutral-50 p-3"
              >
                <span className="text-sm text-[#1e1b1b]">
                  {step.label} Status
                </span>
                <StatusFormatter status={step.status} />
              </div>
            ))}
          </div>
        </div>

        {amendments.length > 0 && (
          <div className="col-span-full">
            <TravelAmendmentHistory amendments={amendments} />
          </div>
        )}

        {pushbacks.length > 0 && (
          <div className="col-span-full">
            <TravelPushbackHistory pushbacks={pushbacks} />
          </div>
        )}
      </div>
    </Modal>
  );
};

type DetailItemProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const DetailItem = ({ label, value, icon: Icon }: DetailItemProps) => (
  <div className="rounded-control flex items-start gap-3 bg-neutral-50 p-3">
    <Icon size={16} className="mt-1 shrink-0 text-rose-500" />
    <div>
      <p className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">
        {label}
      </p>
      <p className="text-sm font-medium text-[#1e1b1b]">{value || "N/A"}</p>
    </div>
  </div>
);
