import {
  Briefcase,
  CheckCircle2,
  Clock,
  Monitor,
  UserCircle,
} from "lucide-react";
import { GeneralNote, InfoCard } from "./GuidelinesPage";

export default function ITRequisitionGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
          <Monitor size={14} /> IT Requisition Policy
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          IT Requisition Guidelines
        </h2>
        <p className="text-slate-500">
          Procedures for requesting hardware, software, and technical
          peripherals for staff members.
        </p>
      </div>

      <GeneralNote />

      {/* Planning Callout */}
      <div className="flex items-start gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-5">
        <div className="rounded-full bg-rose-100 p-2 text-rose-600">
          <Clock size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-rose-900">
            Advance Notice Recommended
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-rose-700">
            IT recommends making a requisition at least 2 weeks prior to
            facilitate proper planning and preparation for the requested
            equipment.
          </p>
        </div>
      </div>

      {/* Required Fields Section */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <CheckCircle2 size={20} className="text-slate-600" />
          Required Submission Fields
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
