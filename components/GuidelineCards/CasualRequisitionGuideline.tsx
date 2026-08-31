import {
  CheckCircle2,
  HardHat,
  CalendarRange,
  UserCircle,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
  TierCard,
} from "./GuidelinePrimitives";

export default function CasualRequisitionGuideline() {
  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <GuidelineHeading icon={<HardHat size={13} />} title="Casual Requisition">
        Procedures for requesting casual staff engagements, including engagement
        period, PPE requirements, and the automated approval workflow.
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
            title="Requisition Details"
            items={[
              "Requesting department and the reporting HOD approver.",
              "The location where the casuals will be engaged.",
              "Number of casuals required and a business justification.",
            ]}
          />
          <InfoCard
            icon={<CalendarRange size={18} />}
            title="Engagement & Safety"
            items={[
              "Engagement period: start and end dates for the casual assignment.",
              "Personal Protective Equipment (PPEs) required for the engagement.",
            ]}
          />
        </div>
      </section>

      {/* Rate Section */}
      <section className="space-y-4">
        <SectionTitle icon={<Wallet size={17} />}>
          Rate Calculation
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoCard
            icon={<Wallet size={18} />}
            title="Daily Rate"
            items={[
              "Ruiru location: KES 798 per casual, per day.",
              "All other locations: KES 868 per casual, per day.",
              "Engineering & HVAC department: KES 1,000 per casual, per day for Technicians, KES 1,500 for Welders (overrides the location-based rate).",
              "Total cost = Number of Casuals &times; Rate per Day &times; Engagement Days.",
            ]}
          />
        </div>
      </section>

      {/* Approval Workflow Section */}
      <section className="space-y-4">
        <SectionTitle icon={<ShieldCheck size={17} />}>
          Approval Workflow
        </SectionTitle>
        <div className="flex flex-col gap-3">
          <TierCard
            tier="All Requests"
            type="Standard Approval Chain"
            cost="Applies to every casual requisition, regardless of cost"
            approvers={["HOD Approval", "HR Approval"]}
            icon={<HardHat size={22} />}
          />
        </div>
      </section>
    </div>
  );
}
