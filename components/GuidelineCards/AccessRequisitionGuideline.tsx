import {
  CheckCircle2,
  ShieldCheck,
  UserCircle,
  LockKeyhole,
} from "lucide-react";
import { GeneralNote, InfoCard } from "./GuidelinesPage";

export default function AccessRequisitionGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
          <LockKeyhole size={14} /> Access Requisition
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          Access Requisition Guidelines
        </h2>
        <p className="text-slate-500">
          Procedures for requesting physical and logical access permissions,
          keys, and location clearances for staff members.
        </p>
      </div>

      <GeneralNote />

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
