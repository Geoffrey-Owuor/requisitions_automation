import {
  CheckCircle2,
  UserRoundPlus,
  Paperclip,
  UserCircle,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
  TierCard,
} from "./GuidelinePrimitives";

export default function EmployeeRequisitionGuideline() {
  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <GuidelineHeading
        icon={<UserRoundPlus size={13} />}
        title="Employee Requisition"
      >
        Procedures for requesting one or more open positions to be filled,
        including required documentation and the automated approval workflow.
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
              "One or more positions, each with its own title, number required, and target fill date.",
              "Whether each position is a Replacement or New, its Job Grade, and its Salary Range in KES (minimum cannot be 0, maximum cannot be less than the minimum).",
              "Business justification and reporting line for each position.",
            ]}
          />
          <InfoCard
            icon={<Paperclip size={18} />}
            title="Attachments"
            items={[
              "A Job Description, KPIs, and Org Chart document are each required per position.",
              "Allowed file types: Microsoft Word, Excel, and PDF.",
              "Maximum size of 2MB per document.",
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
            cost="Applies to every employee requisition"
            approvers={["HOD Approval", "CEO Approval", "HR Approval"]}
            icon={<UserRoundPlus size={22} />}
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
              "Allowed any time until HR approves it - a decline at any stage can still be amended.",
              "Once HR has approved, the requisition is locked and can no longer be changed.",
            ]}
          />
          <InfoCard
            icon={<ShieldCheck size={18} />}
            title="What Happens on Submission"
            items={[
              "The department, HOD approver and any position can be changed, and positions can be added or removed. Every target fill date must be today or later.",
              "Attachments you don't replace are kept. A new position needs all three documents.",
              "The approval workflow restarts from HOD, even if later stages had already approved.",
              "A record of every amendment - what changed, why, and the replaced documents - is kept and visible to approvers.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
