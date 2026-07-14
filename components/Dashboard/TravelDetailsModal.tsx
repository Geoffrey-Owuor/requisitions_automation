"use client";
import {
  X,
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
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "./StatusFormatter";
import { dateFormatter } from "@/public/assets";
import ClientPortal from "../ClientPortal";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getTravelApproverLink } from "@/serverActions/GetTravelApproverLink";
import { useLoadingStore } from "@/store/useLoadingStore";
import { useEffect, useState } from "react";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag: "userData" | "hodPending" | "hrPending" | "directorPending";
  onClose: () => void;
}

export type TravelStageLevels = "hod" | "hr" | "director" | "user";

export const TravelDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const setLoadingLine = useLoadingStore((state) => state.setLoadingLine);
  const { email } = useUser();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("#");

  const handleLinkClick = () => {
    setLoadingLine(true);
    onClose();
  };

  // Get token based on the data flag

  const STAGE_LEVELS: Record<typeof dataFlag, TravelStageLevels> = {
    hodPending: "hod",
    hrPending: "hr",
    directorPending: "director",
    userData: "user", // We have to make sure this is never used as it it not yet available in our data
  };

  const stage = STAGE_LEVELS[dataFlag];

  useEffect(() => {
    const getApprovalLink = async () => {
      try {
        if (!data) return; //do not run when data is not available
        if (
          stage === "user" ||
          data[`travel_${stage}_approval_status`] !== "pending"
        )
          return; //do not run when we are viewing user data or approver status is not pending

        setLoading(true);

        const uuid = data.request_id;
        const resolvedLink = await getTravelApproverLink({
          email,
          stage,
          uuid,
        });

        setLink(resolvedLink);
      } catch (error) {
        console.error("Error fetching approver link:", error);
      } finally {
        setLoading(false);
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
          className="relative w-full max-w-2xl rounded-[20px] border border-white/80 bg-white/90 shadow-[0_32px_64px_rgba(160,60,60,0.15)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-t-[20px] bg-white px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-400 shadow-sm">
                <BriefcaseBusiness size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e1b1b]">
                  Travel Requisition
                </h2>
                <p className="text-[11px] text-neutral-500">
                  ID: {data.request_id} &middot;{" "}
                  {dateFormatter(data.request_created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {stage !== "user" &&
                data[`travel_${stage}_approval_status`] === "pending" && (
                  <>
                    {loading ? (
                      <div className="h-5 w-12 animate-pulse rounded-full bg-gray-300" />
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
                href={`/dashboard/travelpdf/${data.request_id}`}
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

          <div className="layout-scrollbar grid max-h-[80vh] grid-cols-1 gap-4 p-6 md:grid-cols-2">
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

            <div className="col-span-full mt-4 rounded-2xl bg-white/60 p-4 text-black">
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

type DetailItemProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const DetailItem = ({ label, value, icon: Icon }: DetailItemProps) => (
  <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
    <Icon size={16} className="mt-1 shrink-0 text-rose-500" />
    <div>
      <p className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">
        {label}
      </p>
      <p className="text-sm font-medium text-[#1e1b1b]">{value || "N/A"}</p>
    </div>
  </div>
);
