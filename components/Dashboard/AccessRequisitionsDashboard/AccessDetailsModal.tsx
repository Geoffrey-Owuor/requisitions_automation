"use client";
import {
  Calendar,
  MapPin,
  ClipboardList,
  UserRound,
  Hash,
  ArrowUpRight,
  Workflow,
  LockKeyhole,
  ShieldUser,
  LucideIcon,
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "../StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { useQuery } from "@tanstack/react-query";
import { Modal, ModalActionSkeleton, modalActionClass } from "../../Modal";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { getAccessApproverLink } from "@/serverActions/GetAccessApproverLink";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  dataFlag: "userData" | "hodPending" | "securityPending" | "history";
  onClose: () => void;
}

export type AccessStageLevels = "hod" | "security" | "user";

export const AccessDetailsModal = ({
  data,
  isOpen,
  onClose,
  dataFlag,
}: ModalProps) => {
  const { email } = useUser();

  const STAGE_LEVELS: Record<typeof dataFlag, AccessStageLevels> = {
    hodPending: "hod",
    securityPending: "security",
    userData: "user", // We have to make sure this is never used as it is not yet available in our data
    history: "user", // Read-only — approvals happen from the pending tables
  };

  const stage = STAGE_LEVELS[dataFlag];
  const requestId: string | undefined = data?.request_id;

  // Only resolved when the viewer is at a pending approval stage
  const needsReviewLink =
    stage !== "user" && data?.[`${stage}_approver_status`] === "pending";
  const linkQuery = useQuery({
    queryKey: ["accessApproverLink", stage, requestId],
    queryFn: () => getAccessApproverLink({ email, stage, uuid: requestId! }),
    enabled: isOpen && needsReviewLink,
  });

  if (!data) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={<LockKeyhole size={18} className="text-amber-400" />}
      title="Key & Access Requisition"
      subtitle={
        <>
          ID: {data.request_id} &middot;{" "}
          {dateFormatter(data.request_created_at)}
        </>
      }
      actions={
        <>
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
            href={`/dashboard/accesspdf/${data.request_id}`}
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
          icon={Hash}
          label="Staff Number"
          value={data.employee_staff_number}
        />
        <DetailItem
          icon={UserRound}
          label="Department"
          value={data.employee_department}
        />
        <DetailItem
          icon={Calendar}
          label="Issuance Date"
          value={dateFormatter(data.issuance_date)}
        />
        <DetailItem
          icon={MapPin}
          label="Locations"
          value={data.access_locations}
        />

        <div className="col-span-full mt-4 rounded-2xl bg-neutral-50 p-4 text-black">
          <div className="mb-2 flex items-center gap-2 text-amber-500">
            <ClipboardList size={16} className="text-amber-500" />
            <span className="text-xs font-bold tracking-tighter uppercase">
              Access Requirements
            </span>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            {data.access_requirements}
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
              { label: "HOD", status: data.hod_approver_status },
              { label: "Security", status: data.security_approver_status },
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
  <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
    <Icon size={16} className="mt-1 shrink-0 text-amber-500" />
    <div>
      <p className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">
        {label}
      </p>
      <p className="text-sm font-medium text-[#1e1b1b]">{value || "N/A"}</p>
    </div>
  </div>
);
