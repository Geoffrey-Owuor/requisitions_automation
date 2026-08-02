import {
  CheckCircle2,
  ShieldCheck,
  UserCircle,
  LockKeyhole,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
} from "./GuidelinesPage";

export default function AccessRequisitionGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <GuidelineHeading
        icon={<LockKeyhole size={13} />}
        eyebrow="Access Requisition"
        title="Access Requisition Guidelines"
      >
        Procedures for requesting physical and logical access permissions, keys,
        and location clearances for staff members.
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
            title="Employee Information"
            items={[
              "Employee Name, Department, and Staff Number.",
              "Their reporting HOD.",
            ]}
          />
          <InfoCard
            icon={<ShieldCheck size={18} />}
            title="Access Details"
            items={[
              "The intended issuance date for the access.",
              "Specific physical locations or facilities requiring access.",
              "Details of the exact permissions, keys, or security levels needed.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
