"use client";
import {
  Users,
  ArrowUpRight,
  Workflow,
  UserRoundPlus,
  ShieldUser,
  Briefcase,
  Pencil,
} from "lucide-react";
import { QueryResultRow } from "pg";
import { useQuery } from "@tanstack/react-query";
import StatusFormatter from "../StatusFormatter";
import {
  dateFormatter,
  formatJobGrade,
  isEmployeeAmendableHrStatus,
} from "@/public/assets";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getEmployeeApproverLink } from "@/serverActions/GetEmployeeApproverLink";
import { getEmployeeRequisitionDetails } from "@/serverActions/GetEmployeeRequisitionDetails";
import AttachmentTypeGroups from "@/components/Approvers/EmployeeApprovers/AttachmentTypeGroups";
import EmployeeAmendmentHistory from "@/components/Approvers/EmployeeApprovers/EmployeeAmendmentHistory";
import { amendRequisitionHref } from "@/lib/dashboardTables";
import { Modal, ModalActionSkeleton, modalActionClass } from "../../Modal";
import { DetailCardsSkeleton } from "../../Skeletons/DetailCardsSkeleton";
import { DetailsLoadError } from "../DetailsLoadError";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag:
    | "userData"
    | "hodPending"
    | "retailDirectorPending"
    | "directorPending"
    | "hrPending"
    | "history";
  onClose: () => void;
}

export type EmployeeStageLevels =
  | "hod"
  | "retail_director"
  | "director"
  | "hr"
  | "user";

export const EmployeeDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const { email } = useUser();

  const STAGE_LEVELS: Record<typeof dataFlag, EmployeeStageLevels> = {
    hodPending: "hod",
    retailDirectorPending: "retail_director",
    directorPending: "director",
    hrPending: "hr",
    userData: "user", // We have to make sure this is never used as it is not yet available in our data
    history: "user", // Read-only — approvals happen from the pending tables
  };

  const stage = STAGE_LEVELS[dataFlag];
  const requestId: string | undefined = data?.request_id;

  // Position/attachment breakdown is only available once fetched — the list
  // row only carries the rolled-up totals used for the table columns.
  // Refetched on every open (staleTime 0) so an amendment shows up; a cached
  // copy stays on screen meanwhile.
  const detailsQuery = useQuery({
    queryKey: ["employeeRequisitionDetails", requestId],
    queryFn: () => getEmployeeRequisitionDetails(requestId!),
    enabled: isOpen && !!requestId,
    staleTime: 0,
  });
  const details = detailsQuery.data;

  // Only resolved when the viewer is at a pending approval stage
  const needsReviewLink =
    stage !== "user" &&
    data?.[`employee_${stage}_approval_status`] === "pending";
  const linkQuery = useQuery({
    queryKey: ["employeeApproverLink", stage, requestId],
    queryFn: () => getEmployeeApproverLink({ email, stage, uuid: requestId! }),
    enabled: isOpen && needsReviewLink,
  });

  if (!data) return null;

  // Stored as 'N/A' when the Retail Director stage doesn't apply
  const hasRetailDirectorStage =
    data.employee_retail_director_approval_status !== "N/A";

  // Visibility only - the amend form and the amendment route re-check
  // ownership and the HR status
  const canAmend =
    dataFlag === "userData" &&
    data.submitter_email === email &&
    isEmployeeAmendableHrStatus(data.employee_hr_approval_status);

  const approvalChain = [
    { label: "HOD", status: data.employee_hod_approval_status },
    ...(hasRetailDirectorStage
      ? [
          {
            label: "Retail Director",
            status: data.employee_retail_director_approval_status,
          },
        ]
      : []),
    { label: "CEO", status: data.employee_director_approval_status },
    { label: "HR", status: data.employee_hr_approval_status },
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={<UserRoundPlus size={18} className="text-violet-400" />}
      title="Employee Requisition"
      subtitle={<>ID: {data.request_id}</>}
      actions={
        <>
          {canAmend && (
            <Link
              href={amendRequisitionHref("employee", data.request_id)}
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
            href={`/dashboard/employeeview/${data.request_id}`}
            onClick={onClose}
            className={modalActionClass.dark}
          >
            Full Details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
          <Users size={16} className="mt-1 shrink-0 text-violet-500" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-violet-500 uppercase">
              Department
            </p>
            <p className="text-sm font-medium text-[#1e1b1b]">
              {data.employee_department}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
          <Briefcase size={16} className="mt-1 shrink-0 text-violet-500" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-violet-500 uppercase">
              Positions / Headcount
            </p>
            <p className="text-sm font-medium text-[#1e1b1b]">
              {data.total_positions ?? 0} / {data.total_headcount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Positions breakdown */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-tighter text-violet-500 uppercase">
          <Briefcase size={14} />
          Positions
        </div>
        {detailsQuery.isPending ? (
          <DetailCardsSkeleton
            count={Math.min(Math.max(Number(data.total_positions) || 1, 1), 3)}
            withChips
          />
        ) : !details ? (
          <DetailsLoadError
            message={
              detailsQuery.isError
                ? "Couldn't load the positions."
                : "The positions aren't available."
            }
            onRetry={() => detailsQuery.refetch()}
          />
        ) : (
          <div className="space-y-3">
            {details.positions.map((position) => (
              <div
                key={position.positionid}
                className="rounded-xl bg-neutral-50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1e1b1b]">
                    {position.positiontitle}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {position.replacementornew} &middot;{" "}
                    {formatJobGrade(position.jobgrade, position.jobgraderank)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-neutral-500">
                  <span>
                    Required:{" "}
                    <strong className="text-[#1e1b1b]">
                      {position.numberrequired}
                    </strong>
                  </span>
                  <span>
                    Reporting To:{" "}
                    <strong className="text-[#1e1b1b]">
                      {position.reportingto}
                    </strong>
                  </span>
                  <span>
                    Target Fill Date:{" "}
                    <strong className="text-[#1e1b1b]">
                      {dateFormatter(position.datefilled)}
                    </strong>
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                  {position.justification}
                </p>
                <div className="mt-3">
                  <AttachmentTypeGroups
                    attachments={position.attachments.map((attachment) => ({
                      attachmentId: attachment.attachmentid,
                      originalFilename: attachment.originalfilename,
                      attachmentType: attachment.attachmenttype,
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amendment History */}
      {details && details.amendments.length > 0 && (
        <div className="mt-6">
          <EmployeeAmendmentHistory amendments={details.amendments} />
        </div>
      )}

      {/* Approvals Section */}
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-800">
          <Workflow size={16} />
          Approval Chain
        </div>
        <div className="space-y-3">
          {approvalChain.map((step, idx) => (
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
    </Modal>
  );
};
