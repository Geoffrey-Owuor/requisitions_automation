"use client";
import {
  X,
  MapPin,
  Users,
  ArrowUpRight,
  Workflow,
  HardHat,
  ShieldUser,
  Loader2,
  Pencil,
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "../StatusFormatter";
import { dateFormatter } from "@/public/assets";
import ClientPortal from "../../ClientPortal";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getCasualApproverLink } from "@/serverActions/GetCasualApproverLink";
import {
  getCasualRequisitionDetails,
} from "@/serverActions/GetCasualRequisitionDetails";
import { CasualEmailDataValues } from "@/services/CasualEmailSender";
import { useLoadingStore } from "@/store/useLoadingStore";
import { useToggleStore } from "@/store/useToggleStore";
import CasualAmendmentHistory from "../../Approvers/CasualApprovers/CasualAmendmentHistory";
import { useEffect, useState } from "react";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag: "userData" | "hodPending" | "hrPending";
  onClose: () => void;
}

export type CasualStageLevels = "hod" | "hr" | "user";

export const CasualDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const setLoadingLine = useLoadingStore((state) => state.setLoadingLine);
  const setCasualAmendmentRequestId = useToggleStore(
    (state) => state.setCasualAmendmentRequestId,
  );
  const { email } = useUser();
  const [linkLoading, setLinkLoading] = useState(false);
  const [link, setLink] = useState("#");
  const [details, setDetails] = useState<CasualEmailDataValues | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleLinkClick = () => {
    setLoadingLine(true);
    onClose();
  };

  const STAGE_LEVELS: Record<typeof dataFlag, CasualStageLevels> = {
    hodPending: "hod",
    hrPending: "hr",
    userData: "user", // We have to make sure this is never used as it is not yet available in our data
  };

  const stage = STAGE_LEVELS[dataFlag];

  // Section-level breakdown is only available once fetched — the list row
  // only carries the rolled-up totals used for the table columns.
  useEffect(() => {
    const fetchDetails = async () => {
      if (!data) {
        setDetails(null);
        return;
      }
      setDetailsLoading(true);
      try {
        const result = await getCasualRequisitionDetails(data.request_id);
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
          data[`casual_${stage}_approval_status`] !== "pending"
        )
          return; //do not run when we are viewing user data or approver status is not pending

        setLinkLoading(true);

        const uuid = data.request_id;
        const resolvedLink = await getCasualApproverLink({
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

  return (
    <ClientPortal>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-[20px] border border-white/80 bg-white/90 shadow-[0_32px_64px_rgba(20,140,100,0.15)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-t-[20px] bg-white px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-400 shadow-sm">
                <HardHat size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e1b1b]">
                  Casual Requisition
                </h2>
                <p className="text-[11px] text-neutral-500">
                  ID: {data.request_id} &middot;{" "}
                  {dateFormatter(data.request_created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {dataFlag === "userData" &&
                data.submitter_email === email &&
                data.casual_hr_approval_status === "pending" && (
                  <button
                    onClick={() => {
                      setCasualAmendmentRequestId(data.request_id);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-amber-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Amend
                  </button>
                )}
              {stage !== "user" &&
                data[`casual_${stage}_approval_status`] === "pending" && (
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
                href={`/dashboard/casualpdf/${data.request_id}`}
                onClick={handleLinkClick}
                className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
              >
                Pdf
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
              <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
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
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8 text-emerald-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {details?.sections.map((section) => (
                    <div
                      key={section.sectionname}
                      className="rounded-xl bg-white/60 p-3"
                    >
                      <div className="flex items-center justify-between">
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
                  {details && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 text-sm">
                      <span className="font-semibold text-[#1e1b1b]">
                        Total ({details.totalcasuals} casuals)
                      </span>
                      <span className="font-semibold text-[#1e1b1b]">
                        KES {details.totalamount}
                      </span>
                    </div>
                  )}
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

            {/* Amendment History */}
            {details && details.amendments.length > 0 && (
              <CasualAmendmentHistory amendments={details.amendments} />
            )}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
};
