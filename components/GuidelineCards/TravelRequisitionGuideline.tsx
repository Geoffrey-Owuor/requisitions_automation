import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Plane,
  Shield,
  UserCircle,
} from "lucide-react";
import { GeneralNote, InfoCard, TierCard } from "./GuidelinesPage";

// Guidelines Content Components
export default function TravelRequisitionGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/50 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-rose-600 uppercase">
          <Plane size={14} /> Travel Requisition
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          Travel Requisition Guidelines
        </h2>
        <p className="text-slate-500">
          Essential requirements and approval tiers for site visits, local
          flights, and international business travel.
        </p>
      </div>

      <GeneralNote />

      {/* Required Fields Section */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <CheckCircle2 size={20} className="text-rose-500" />
          Required Submission Fields
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={<UserCircle size={18} />}
            title="Employee & Trip Details"
            items={[
              "Basic employee info: Name, department, HOD, and designation.",
              "Travel specifics: Departure and return dates.",
              "Travel parameters: Category (Local/International) and Mode (Road/Air).",
            ]}
          />
          <InfoCard
            icon={<CreditCard size={18} />}
            title="Financial Details"
            items={[
              "A valid business justification for the requisition.",
              "Two-way transport costs, per diem entitlement, and miscellaneous expenses.",
              "Department cost centre selection and confirmation if the cost is within budget.",
            ]}
          />
        </div>
      </section>

      {/* Approval Tiers Section */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Shield size={20} className="text-rose-500" />
          Approval Tiers
        </h3>
        <div className="flex flex-col gap-4">
          <TierCard
            tier="Tier 1"
            type="Local Road Travel"
            cost="Under KES 30k"
            approvers={["HOD Approval"]}
            icon={<MapPin size={24} className="text-slate-400" />}
          />
          <TierCard
            tier="Tier 2"
            type="Local Air Travel"
            cost="KES 30k - 100k"
            approvers={["HOD Approval", "HR Approval"]}
            icon={<Plane size={24} className="text-slate-400" />}
          />
          <TierCard
            tier="Tier 3"
            type="International Travel"
            cost="Above KES 100k"
            approvers={["HOD Approval", "HR Approval", "Director Approval"]}
            icon={<Shield size={24} className="text-slate-400" />}
          />
        </div>
      </section>
    </div>
  );
}
