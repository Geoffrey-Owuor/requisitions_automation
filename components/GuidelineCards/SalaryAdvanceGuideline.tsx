import {
  CheckCircle2,
  CalendarClock,
  Scale,
  UserCircle,
  FileText,
  CircleDollarSign,
} from "lucide-react";
import {
  GeneralNote,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
} from "./GuidelinesPage";

export default function SalaryAdvanceGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <GuidelineHeading
        icon={<CircleDollarSign size={13} />}
        eyebrow="Salary Advance"
        title="Salary Advance"
      >
        Policies and procedures governing the request, processing, and repayment
        of employee salary advances to ensure compliance and efficient financial
        management.
      </GuidelineHeading>

      <GeneralNote />

      {/* Policy Provisions Section */}
      <section className="space-y-5">
        <SectionTitle icon={<Scale size={17} />}>
          Policy Provisions
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={<CalendarClock size={18} />}
            title="Schedules & Deadlines"
            items={[
              "Submission Deadline: Requests must be submitted no later than the 10th of every month.",
              "Processing Schedule: Advances are processed once per month, specifically by the 15th.",
              "Exception: Requests received outside the deadline will not be processed, except in documented, verified emergencies.",
            ]}
          />
          <InfoCard
            icon={<Scale size={18} />}
            title="Terms & Compliance"
            items={[
              "Legal Compliance: All advances must strictly align with the one-third (1/3) rule.",
              "Repayment Terms: The maximum repayment period for any advance is three (3) months.",
              "Limitation: Multiple active salary advances are strictly not allowed.",
            ]}
          />
        </div>
      </section>

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
              "Staff Number (automatically retrieves your associated Name and Email).",
              "Current Department and specific Location are also retrieved automatically from the staff number.",
            ]}
          />
          <InfoCard
            icon={<FileText size={18} />}
            title="Advance Details"
            items={[
              "The specific Request Amount you are applying for.",
              "Number of repayment installments (maximum of 3).",
              "Repayment Start Date and Request Type (One-off or Continuous).",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
