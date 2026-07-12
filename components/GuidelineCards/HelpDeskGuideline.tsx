import {
  CheckCircle2,
  Lightbulb,
  LayoutList,
  Paperclip,
  LaptopMinimalCheck,
} from "lucide-react";
import { InfoCard } from "./GuidelinesPage";

export default function HelpdeskGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
          <LaptopMinimalCheck size={14} /> HelpDesk
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          HelpDesk Issue Submission
        </h2>
        <p className="text-slate-500">
          Procedures for reporting issues, requesting assistance, and routing
          tickets to the IT department.
        </p>
      </div>

      {/* Manual Link Callout */}
      <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="rounded-full bg-blue-100 p-2 text-blue-600">
          <Lightbulb size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Need More Details?</h4>
          <p className="mt-1 text-sm leading-relaxed text-blue-800">
            For comprehensive information on issue types, priority levels, and
            more - please review the{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://192.168.0.155:8443/manual"
              className="font-semibold underline underline-offset-2 transition-colors hover:text-blue-600"
            >
              HelpDesk Manual
            </a>
            .
          </p>
        </div>
      </div>

      {/* Required Fields Section */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <CheckCircle2 size={20} className="text-slate-600" />
          Submission Requirements
        </h3>
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
