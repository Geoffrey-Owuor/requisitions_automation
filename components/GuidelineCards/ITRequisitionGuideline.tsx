import {
  Briefcase,
  CheckCircle2,
  Lightbulb,
  Monitor,
  UserCircle,
} from "lucide-react";
import {
  Callout,
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
} from "./GuidelinePrimitives";

export default function ITRequisitionGuideline() {
  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <GuidelineHeading icon={<Monitor size={13} />} title="IT Requisition">
        Procedures for requesting hardware, software, and technical peripherals
        for staff members.
      </GuidelineHeading>

      <GeneralNote />

      {/* Planning Callout */}
      <Callout
        icon={<Lightbulb size={18} />}
        title="Advance Notice Recommended"
        tone="rose"
      >
        IT recommends making a requisition at least 2 weeks prior to facilitate
        proper planning and preparation for the requested equipment.
      </Callout>

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
              "Their reporting HOD and their official joining date.",
            ]}
          />
          <InfoCard
            icon={<Briefcase size={18} />}
            title="Equipment Specifications"
            items={[
              "Specify if it is a new equipment request or a replacement.",
              "The ideal requisition date when the equipment is needed.",
              "Specific items required (e.g., laptop, phone extension, desktop, email).",
              "Any other custom requirements not covered by predefined categories.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
