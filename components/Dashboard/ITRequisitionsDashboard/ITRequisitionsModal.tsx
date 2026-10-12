"use client";
import { QueryResultRow } from "pg";
import {
  Monitor,
  Building2,
  Calendar,
  ClipboardList,
  CheckCircle2,
  UserRound,
  ArrowUpRight,
  ShieldUser,
} from "lucide-react";
import StatusFormatter from "../StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { useQuery } from "@tanstack/react-query";
import {
  Modal,
  ModalActionSkeleton,
  modalActionClass,
} from "@/components/Modal";
import {
  getITApproverLink,
  ITStageLevels,
} from "@/serverActions/GetITApproverLink";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

interface ITRequisitionModalProps {
  isOpen: boolean;
  dataFlag: "userData" | "hodPending" | "itPending" | "itAll" | "history";
  data: QueryResultRow | null;
  onClose: () => void;
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-400">
        <Icon size={14} />
      </div>
      <h3 className="text-[11px] font-bold tracking-widest text-red-400 uppercase">
        {title}
      </h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const generateValue = (value: React.ReactNode) => {
    if (value) {
      if (label === "Requirements") {
        const valueArray = value.toString().split(", ");
        return (
          <span className="flex flex-wrap items-center gap-2">
            {valueArray.map((value) => (
              <div
                className="rounded-lg bg-neutral-200 px-2 py-1 text-xs font-medium"
                key={value}
              >
                {value}
              </div>
            ))}
          </span>
        );
      } else {
        return value;
      }
    } else {
      return "—";
    }
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {label}
      </span>
      <span className="max-w-50 truncate text-sm text-[#1e1b1b]">
        {generateValue(value)}
      </span>
    </div>
  );
}

export function ITRequisitionModal({
  isOpen,
  data,
  onClose,
  dataFlag,
}: ITRequisitionModalProps) {

  const { email } = useUser();

  const formatRequirements = (val: unknown) => {
    if (!val) return "—";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  // Get token based on the data flag

  const STAGE_LEVELS: Record<typeof dataFlag, ITStageLevels> = {
    hodPending: "hod",
    itPending: "it",
    userData: "user", // We have to make sure this is never used as it it not yet available in our data
    history: "user", // Read-only — approvals happen from the pending tables
    itAll: "it",
  };

  const stage = STAGE_LEVELS[dataFlag];
  const requestId: string | undefined = data?.request_id;

  // Only resolved when the viewer is at a pending approval stage
  const needsReviewLink =
    stage !== "user" && data?.[`${stage}_approver_status`] === "pending";
  const linkQuery = useQuery({
    queryKey: ["itApproverLink", stage, requestId],
    queryFn: () => getITApproverLink({ email, stage, uuid: requestId! }),
    enabled: isOpen && needsReviewLink,
  });

  if (!data) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={<Monitor size={18} className="text-red-400" />}
      title="IT Requisition"
      subtitle={
        <>
          ID: {data.request_id} &middot;{" "}
          {dateFormatter(data.request_created_at)}
        </>
      }
      bodyClassName="space-y-6 p-5 sm:p-6"
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
            href={`/dashboard/itpdf/${data.request_id}`}
            onClick={onClose}
            className={modalActionClass.dark}
          >
            Pdf
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </>
      }
    >
      {/* — Submitter Info — */}
      <section>
        <SectionHeader icon={UserRound} title="Submitted By" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field label="Name" value={data.submitter_name} />
          <Field label="Email" value={data.submitter_email} />
        </div>
      </section>

      {/* — Employee Info — */}
      <section>
        <SectionHeader icon={Building2} title="Employee Details" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field label="Employee Name" value={data.employee_name} />
          <Field label="Staff Number" value={data.employee_staff_number} />
          <Field label="Department" value={data.employee_department} />
          <Field
            label="Replacement / New"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  data.replacement_new === "New"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {data.replacement_new}
              </span>
            }
          />
        </div>
      </section>

      {/* — Requisition Details — */}
      <section>
        <SectionHeader icon={ClipboardList} title="Requisition Details" />
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field
            label="Requirements"
            value={formatRequirements(data.requirements)}
          />
          {data.other_requirements && (
            <Field label="Other Requirements" value={data.other_requirements} />
          )}
        </div>
      </section>

      {/* — Dates — */}
      <section>
        <SectionHeader icon={Calendar} title="Key Dates" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field
            label="Requisition Date"
            value={dateFormatter(data.requisition_date)}
          />
          <Field
            label="Date of Joining"
            value={dateFormatter(data.date_joining)}
          />
        </div>
      </section>

      {/* — HOD Approval — */}
      <section>
        <SectionHeader icon={CheckCircle2} title="HOD Approval" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field label="Approver" value={data.hod_approver_name} />
          <Field
            label="Status"
            value={<StatusFormatter status={data.hod_approver_status} />}
          />
          <Field
            label="Approval Date"
            value={dateFormatter(data.hod_approval_date)}
          />
          {data.hod_approver_comments && (
            <Field label="Comments" value={data.hod_approver_comments} />
          )}
        </div>
      </section>

      {/* — IT Approval — */}
      <section>
        <SectionHeader icon={CheckCircle2} title="IT Approval" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-neutral-50 p-4">
          <Field label="Approver" value={data.it_approver_name} />
          <Field
            label="Status"
            value={<StatusFormatter status={data.it_approver_status} />}
          />
          <Field
            label="Approval Date"
            value={dateFormatter(data.it_approval_date)}
          />
          {data.it_approver_comments && (
            <Field label="Comments" value={data.it_approver_comments} />
          )}
        </div>
      </section>

      {/* — Completion — */}
      <section>
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-neutral-50 px-4 py-3">
          <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            Completion Status
          </span>
          <StatusFormatter status={data.completion_status} />
        </div>
      </section>
    </Modal>
  );
}
