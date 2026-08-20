import {
  CheckCircle2,
  UserRoundPlus,
  Paperclip,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
  TierCard,
} from "./GuidelinesPage";

export default function EmployeeRequisitionGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <GuidelineHeading
        icon={<UserRoundPlus size={13} />}
        eyebrow="Employee Requisition"
        title="Employee Requisition"
      >
        Procedures for requesting one or more open positions to be filled,
        including required documentation and the automated approval workflow.
      </GuidelineHeading>

      <GeneralNote />

      {/* Required Fields Section */}
      <section className="space-y-5">
        <SectionTitle icon={<CheckCircle2 size={17} />}>
          Required Submission Fields
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={<UserCircle size={18} />}
            title="Requisition Details"
            items={[
              "Requesting department and the reporting HOD approver.",
              "One or more positions, each with its own title, number required, and target fill date.",
              "Business justification and reporting line for each position.",
            ]}
          />
          <InfoCard
            icon={<Paperclip size={18} />}
            title="Attachments"
            items={[
              "At least one supporting document (Job Description / KPIs) is required per position.",
              "Allowed file types: Microsoft Word, Excel, and PDF.",
              "Maximum size of 5MB for all documents attached to a single position.",
            ]}
          />
        </div>
      </section>

      {/* Approval Workflow Section */}
      <section className="space-y-5">
        <SectionTitle icon={<ShieldCheck size={17} />}>
          Approval Workflow
        </SectionTitle>
        <div className="flex flex-col gap-4">
          <TierCard
            tier="All Requests"
            type="Standard Approval Chain"
            cost="Applies to every employee requisition"
            approvers={["HOD Approval", "CEO Approval", "HR Approval"]}
            icon={<UserRoundPlus size={22} />}
          />
        </div>
      </section>
    </div>
  );
}
