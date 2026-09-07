"use client";
import {
  X,
  Users,
  ArrowUpRight,
  Workflow,
  UserRoundPlus,
  ShieldUser,
  Briefcase,
  Loader2,
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "../StatusFormatter";
import { RETAIL_DEPARTMENT, dateFormatter, getJobGradeNumber } from "@/public/assets";
import ClientPortal from "../../ClientPortal";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getEmployeeApproverLink } from "@/serverActions/GetEmployeeApproverLink";
import { getEmployeeRequisitionDetails } from "@/serverActions/GetEmployeeRequisitionDetails";
import { EmployeeEmailDataValues } from "@/services/EmployeeEmailSender";
import AttachmentTypeGroups from "@/components/Approvers/EmployeeApprovers/AttachmentTypeGroups";
import { useLoadingStore } from "@/store/useLoadingStore";
import { useEffect, useState } from "react";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag:
    | "userData"
    | "hodPending"
    | "retailDirectorPending"
    | "directorPending"
    | "hrPending";
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
  const setLoadingLine = useLoadingStore((state) => state.setLoadingLine);
  const { email } = useUser();
  const [linkLoading, setLinkLoading] = useState(false);
  const [link, setLink] = useState("#");
  const [details, setDetails] = useState<EmployeeEmailDataValues | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleLinkClick = () => {
    setLoadingLine(true);
    onClose();
  };

  const STAGE_LEVELS: Record<typeof dataFlag, EmployeeStageLevels> = {
    hodPending: "hod",
    retailDirectorPending: "retail_director",
    directorPending: "director",
    hrPending: "hr",
    userData: "user", // We have to make sure this is never used as it is not yet available in our data
  };

  const stage = STAGE_LEVELS[dataFlag];

  // Position/attachment breakdown is only available once fetched — the list
  // row only carries the rolled-up totals used for the table columns.
  useEffect(() => {
    const fetchDetails = async () => {
      if (!data) {
        setDetails(null);
        return;
      }
      setDetailsLoading(true);
      try {
        const result = await getEmployeeRequisitionDetails(data.request_id);
        setDetails(result);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [data]);

  useEffect(() => {
    const getApprovalLink = async () => {
      try {
        if (!data) return; //do not run when data is not available
        if (
          stage === "user" ||
          data[`employee_${stage}_approval_status`] !== "pending"
        )
          return; //do not run when we are viewing user data or approver status is not pending

        setLinkLoading(true);

        const uuid = data.request_id;
        const resolvedLink = await getEmployeeApproverLink({
          email,
          stage,
          uuid,
        });

        setLink(resolvedLink);
      } catch (error) {
        console.error("Error fetching approver link:", error);
      } finally {
        setLinkLoading(false);
      }
    };

    getApprovalLink();
  }, [data, stage, email]);

  if (!isOpen || !data) return null;

  const isRetail = data.employee_department === RETAIL_DEPARTMENT;

  const approvalChain = [
    { label: "HOD", status: data.employee_hod_approval_status },
    ...(isRetail
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
    <ClientPortal>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-[20px] border border-white/80 bg-white/90 shadow-[0_32px_64px_rgba(110,60,180,0.15)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-t-[20px] bg-white px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-400 shadow-sm">
                <UserRoundPlus size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e1b1b]">
                  Employee Requisition
                </h2>
                <p className="text-[11px] text-neutral-500">
                  ID: {data.request_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {stage !== "user" &&
                data[`employee_${stage}_approval_status`] === "pending" && (
                  <>
                    {linkLoading ? (
                      <div className="h-5 w-20 animate-pulse rounded-full bg-gray-300" />
                    ) : (
                      <Link
                        href={link}
                        onClick={handleLinkClick}
                        className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
                      >
                        <ShieldUser className="h-3.5 w-3.5" />
                        Review
                      </Link>
                    )}
                  </>
                )}
              <Link
                href={`/dashboard/employeeview/${data.request_id}`}
                onClick={handleLinkClick}
                className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
              >
                Full Details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="layout-scrollbar max-h-[80vh] space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
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
              <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
                <Briefcase
                  size={16}
                  className="mt-1 shrink-0 text-violet-500"
                />
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
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8 text-violet-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {details?.positions.map((position) => (
                    <div
                      key={position.positionid}
                      className="rounded-xl bg-white/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1e1b1b]">
                          {position.positiontitle}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {position.replacementornew} &middot;{" "}
                          {position.jobgrade} (Grade{" "}
                          {getJobGradeNumber(position.jobgrade)})
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
                          attachments={position.attachments.map(
                            (attachment) => ({
                              attachmentId: attachment.attachmentid,
                              originalFilename: attachment.originalfilename,
                              attachmentType: attachment.attachmenttype,
                            }),
                          )}
                        />
                      </div>
                    </div>
                  ))}
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
                {approvalChain.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-white/60 p-3"
                  >
                    <span className="text-sm text-[#1e1b1b]">
                      {step.label} Status
                    </span>
                    <StatusFormatter status={step.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
};
