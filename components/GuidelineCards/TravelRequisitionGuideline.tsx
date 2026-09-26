import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Pencil,
  Plane,
  Shield,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
  TierCard,
} from "./GuidelinePrimitives";

// Guidelines Content Components
export default function TravelRequisitionGuideline() {
  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <GuidelineHeading icon={<Plane size={13} />} title="Travel Requisition">
        Essential requirements and approval tiers for site visits, local
        flights, and international business travel.
      </GuidelineHeading>

      <GeneralNote />

      {/* Required Fields Section */}
      <section className="space-y-4">
        <SectionTitle icon={<CheckCircle2 size={17} />}>
          Required Submission Fields
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
      <section className="space-y-4">
        <SectionTitle icon={<Shield size={17} />}>Approval Tiers</SectionTitle>
        <div className="flex flex-col gap-3">
          <TierCard
            tier="Tier 1"
            type="Local Road Travel"
            cost="Under KES 30k"
            approvers={["HOD Approval", "HR Approval"]}
            icon={<MapPin size={22} />}
          />
          <TierCard
            tier="Tier 2"
            type="Local Air Travel"
            cost="KES 30k - 100k"
            approvers={["HOD Approval", "HR Approval"]}
            icon={<Plane size={22} />}
          />
          <TierCard
            tier="Tier 3"
            type="International Travel"
            cost="Above KES 100k"
            approvers={["HOD Approval", "HR Approval", "Director Approval"]}
            icon={<Shield size={22} />}
          />
        </div>
      </section>

      {/* Amendments Section */}
      <section className="space-y-4">
        <SectionTitle icon={<Pencil size={17} />}>Amendments</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoCard
            icon={<Pencil size={18} />}
            title="Who & When"
            items={[
              "Only the original submitter can amend their own requisition.",
              "Allowed until HR approves it - a HOD or HR decline can still be amended.",
              "No amendments after the departure date, or once HR has approved.",
            ]}
          />
          <InfoCard
            icon={<ShieldCheck size={18} />}
            title="What Happens on Submission"
            items={[
              "Any field can be changed - trip details, dates, costs, department or HOD approver.",
              "The approval workflow restarts from HOD, and the tier is recalculated from the new total.",
              "A record of every amendment - what changed and why - is kept and visible to approvers and on the requisition PDF/emails.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
