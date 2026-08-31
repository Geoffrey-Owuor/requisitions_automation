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
} from "./GuidelinePrimitives";

export default function AccessRequisitionGuideline() {
  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <GuidelineHeading
        icon={<LockKeyhole size={13} />}
        title="Key(s) & Access Code Issuance"
      >
        Procedures for requesting physical and logical access permissions, keys,
        and location clearances for staff members.
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
