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
} from "lucide-react";
import { QueryResultRow } from "pg";
import StatusFormatter from "./StatusFormatter";
import { dateFormatter } from "@/public/assets";

interface ModalProps {
  data: QueryResultRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TravelDetailsModal = ({ data, isOpen, onClose }: ModalProps) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/80 bg-white/90 shadow-[0_32px_64px_rgba(160,60,60,0.15)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-8 py-6">
          <div>
            <h2 className="text-xl font-semibold text-[#1e1b1b]">
              Requisition Details
            </h2>
            <p className="text-xs font-medium text-neutral-500">
              ID: {data.request_id} &middot;{" "}
              {dateFormatter(data.request_created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-black transition-colors hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[80vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
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

          <div className="col-span-full mt-4 rounded-2xl bg-gray-200/50 p-4 text-black">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare size={16} />
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
            <h3 className="mb-4 text-sm font-semibold text-[#1e1b1b]">
              Approval Chain
            </h3>
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
                  className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3"
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
  );
};

type DetailItemProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const DetailItem = ({ label, value, icon: Icon }: DetailItemProps) => (
  <div className="flex items-start gap-3 rounded-xl border border-rose-100/20 bg-rose-50/30 p-3">
    <Icon size={16} className="mt-1 shrink-0 text-rose-500" />
    <div>
      <p className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">
        {label}
      </p>
      <p className="text-sm font-medium text-[#1e1b1b]">{value || "N/A"}</p>
    </div>
  </div>
);
