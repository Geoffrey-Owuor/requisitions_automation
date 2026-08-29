import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Plane,
  Shield,
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
    </div>
  );
}
