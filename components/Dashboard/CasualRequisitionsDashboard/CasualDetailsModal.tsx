"use client";
import {
  MapPin,
  Users,
  ArrowUpRight,
  Workflow,
  HardHat,
  ShieldUser,
  Pencil,
} from "lucide-react";
import { QueryResultRow } from "pg";
import { useQuery } from "@tanstack/react-query";
import StatusFormatter from "../StatusFormatter";
import { dateFormatter, isCasualAmendableHrStatus } from "@/public/assets";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getCasualApproverLink } from "@/serverActions/GetCasualApproverLink";
import { getCasualRequisitionDetails } from "@/serverActions/GetCasualRequisitionDetails";
import { amendRequisitionHref } from "@/lib/dashboardTables";
import CasualAmendmentHistory from "../../Approvers/CasualApprovers/CasualAmendmentHistory";
import { Modal, ModalActionSkeleton, modalActionClass } from "../../Modal";
import { DetailCardsSkeleton } from "../../Skeletons/DetailCardsSkeleton";
import { DetailsLoadError } from "../DetailsLoadError";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag: "userData" | "hodPending" | "hrPending" | "history";
  onClose: () => void;
}

export type CasualStageLevels = "hod" | "hr" | "user";

export const CasualDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const { email } = useUser();

  const STAGE_LEVELS: Record<typeof dataFlag, CasualStageLevels> = {
    hodPending: "hod",
    hrPending: "hr",
    userData: "user", // We have to make sure this is never used as it is not yet available in our data
    history: "user", // Read-only — approvals happen from the pending tables
  };

  const stage = STAGE_LEVELS[dataFlag];
  const requestId: string | undefined = data?.request_id;

  // Section-level breakdown is only available once fetched — the list row
  // only carries the rolled-up totals used for the table columns. Refetched
  // on every open (staleTime 0) so an amendment shows up; a cached copy stays
  // on screen meanwhile.
  const detailsQuery = useQuery({
    queryKey: ["casualRequisitionDetails", requestId],
    queryFn: () => getCasualRequisitionDetails(requestId!),
    enabled: isOpen && !!requestId,
    staleTime: 0,
  });
  const details = detailsQuery.data;

  // Only resolved when the viewer is at a pending approval stage
  const needsReviewLink =
    stage !== "user" && data?.[`casual_${stage}_approval_status`] === "pending";
  const linkQuery = useQuery({
    queryKey: ["casualApproverLink", stage, requestId],
    queryFn: () => getCasualApproverLink({ email, stage, uuid: requestId! }),
    enabled: isOpen && needsReviewLink,
  });

  if (!data) return null;

  const canAmend =
    dataFlag === "userData" &&
    data.submitter_email === email &&
    isCasualAmendableHrStatus(data.casual_hr_approval_status);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={<HardHat size={18} className="text-emerald-400" />}
      title="Casual Requisition"
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
              href={amendRequisitionHref("casual", data.request_id)}
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
          <Link
            href={`/dashboard/casualpdf/${data.request_id}`}
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
        <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
          <MapPin size={16} className="mt-1 shrink-0 text-emerald-500" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
              Location
            </p>
            <p className="text-sm font-medium text-[#1e1b1b]">
              {data.casual_location}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
          <Users size={16} className="mt-1 shrink-0 text-emerald-500" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
              Department
            </p>
            <p className="text-sm font-medium text-[#1e1b1b]">
              {data.employee_department}
            </p>
          </div>
        </div>
      </div>

      {/* Sections breakdown */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-tighter text-emerald-500 uppercase">
          <Users size={14} />
          Sections
        </div>
        {detailsQuery.isPending ? (
          <DetailCardsSkeleton
            count={Math.min(Math.max(Number(data.section_count) || 1, 1), 3)}
          />
        ) : !details ? (
          <DetailsLoadError
            message={
              detailsQuery.isError
                ? "Couldn't load the sections."
                : "The sections aren't available."
            }
            onRetry={() => detailsQuery.refetch()}
          />
        ) : (
          <div className="space-y-2">
            {details.sections.map((section) => (
              <div
                key={section.sectionname}
                className="rounded-xl bg-neutral-50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold text-[#1e1b1b]">
                    {section.sectionname}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {dateFormatter(section.periodfrom)} &ndash;{" "}
                    {dateFormatter(section.periodto)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                  {section.justification}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-neutral-500">
                  <span>
                    Casuals:{" "}
                    <strong className="text-[#1e1b1b]">
                      {section.numberofcasuals}
                    </strong>
                  </span>
                  <span>
                    Total:{" "}
                    <strong className="text-[#1e1b1b]">
                      KES {section.totalamount}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-sm">
              <span className="font-semibold text-[#1e1b1b]">
                Total ({details.totalcasuals} casuals)
              </span>
              <span className="font-semibold text-[#1e1b1b]">
                KES {details.totalamount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Approvals Section */}
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-800">
          <Workflow size={16} />
          Approval Chain
        </div>
        <div className="space-y-3">
          {[
            { label: "HOD", status: data.casual_hod_approval_status },
            { label: "HR", status: data.casual_hr_approval_status },
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-neutral-50 p-3"
            >
              <span className="text-sm text-[#1e1b1b]">
                {step.label} Status
              </span>
              <StatusFormatter status={step.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Amendment History */}
      {details && details.amendments.length > 0 && (
        <CasualAmendmentHistory amendments={details.amendments} />
      )}
    </Modal>
  );
};
