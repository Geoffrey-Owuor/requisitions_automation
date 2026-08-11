import {
  CheckCircle2,
  Lightbulb,
  LayoutList,
  Paperclip,
  LaptopMinimalCheck,
} from "lucide-react";
import {
  Callout,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
} from "./GuidelinesPage";
import Link from "next/link";

export default function HelpdeskGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <GuidelineHeading
        icon={<LaptopMinimalCheck size={13} />}
        eyebrow="HelpDesk"
        title="HelpDesk"
      >
        Procedures for reporting issues, requesting assistance, and routing
        tickets to the IT department.
      </GuidelineHeading>

      {/* Manual Link Callout */}
      <Callout
        icon={<Lightbulb size={18} />}
        title="Need More Details?"
        tone="blue"
      >
        For comprehensive information on issue types, priority levels, and more
        - please review the{" "}
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="/helpdesk/manual"
          className="font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-500"
        >
          HelpDesk Manual
        </Link>
        .
      </Callout>

      {/* Required Fields Section */}
      <section className="space-y-5">
        <SectionTitle icon={<CheckCircle2 size={17} />}>
          Submission Requirements
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={<LayoutList size={18} />}
            title="Ticket Details"
            items={[
              "Select the Target Department (IT) to route the ticket.",
              "Choose the specific Issue Type that best categorizes your problem.",
              "Provide a concise, descriptive Issue Title.",
              "Write a detailed Issue Description explaining the problem, steps to reproduce, or assistance needed.",
            ]}
          />
          <InfoCard
            icon={<Paperclip size={18} />}
            title="Supporting Documentation"
            items={[
              "File Attachments (Optional but highly recommended).",
              "Upload screenshots, error logs, or relevant documents to help the support team resolve your issue faster.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
