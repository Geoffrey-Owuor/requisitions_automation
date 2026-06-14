"use client";
import { QueryResultRow } from "pg";
import {
  X,
  Monitor,
  Building2,
  Calendar,
  ClipboardList,
  CheckCircle2,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import StatusFormatter from "../StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { useLoadingStore } from "@/store/useLoadingStore";
import ClientPortal from "@/components/ClientPortal";
import Link from "next/link";

interface ITRequisitionModalProps {
  isOpen: boolean;
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
                className="rounded-lg bg-neutral-200/70 px-2 py-1 text-xs font-medium"
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
}: ITRequisitionModalProps) {
  const setLoadingLine = useLoadingStore((state) => state.setLoadingLine);

  const handlePdfLink = () => {
    onClose();
    setLoadingLine(true);
  };

  const formatRequirements = (val: unknown) => {
    if (!val) return "—";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  if (!isOpen || !data) return null;

  return (
    <ClientPortal>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        {/* Modal Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-[20px] border border-b border-gray-200 bg-white/90 shadow-[0_32px_64px_rgba(60,100,160,0.15)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-[20px] border-b border-neutral-100/50 bg-neutral-50/40 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-400 shadow-sm">
                <Monitor size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e1b1b]">
                  IT Requisition
                </h2>
                <p className="text-[11px] text-gray-400">
                  ID: {data.request_id} &middot;{" "}
                  {dateFormatter(data.request_created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href={`/itapproval/${data.request_id}/pdfdownload`}
                onClick={handlePdfLink}
                className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
              >
                Pdf
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-neutral-200 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="layout-scrollbar max-h-[80vh] space-y-6 px-6 py-6">
            {/* — Submitter Info — */}
            <section>
              <SectionHeader icon={UserRound} title="Submitted By" />
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <Field label="Name" value={data.submitter_name} />
                <Field label="Email" value={data.submitter_email} />
              </div>
            </section>

            {/* — Employee Info — */}
            <section>
              <SectionHeader icon={Building2} title="Employee Details" />
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <Field label="Employee Name" value={data.employee_name} />
                <Field
                  label="Staff Number"
                  value={data.employee_staff_number}
                />
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
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <Field
                  label="Requirements"
                  value={formatRequirements(data.requirements)}
                />
                {data.other_requirements && (
                  <Field
                    label="Other Requirements"
                    value={data.other_requirements}
                  />
                )}
              </div>
            </section>

            {/* — Dates — */}
            <section>
              <SectionHeader icon={Calendar} title="Key Dates" />
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
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
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
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
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white/60 p-4">
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
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/60 px-4 py-3">
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                  Completion Status
                </span>
                <StatusFormatter status={data.completion_status} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
