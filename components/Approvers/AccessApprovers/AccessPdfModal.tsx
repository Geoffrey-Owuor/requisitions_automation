"use client";

import { AccessMailTemplateValues as AccessPdfValues } from "@/services/AccessEmailSender";
import { Printer } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AccessRequisitionPdf from "./AccessRequisitionPdf";
import { useEffect, useState } from "react";
import {
  ACCESS_LOCATIONS_LABEL,
  ACCESS_REQUIREMENTS_LABEL,
  employeeAcknowledgement,
  getAccessPolicy,
} from "@/lib/accessRequisition";
import AccessPolicyConditions from "./AccessPolicyConditions";

// One signatory's lines, mirroring the PDF
const SignatureBlock = ({ title, name }: { title: string; name?: string }) => (
  <div className="flex flex-col gap-4">
    <p className="text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
      {title}
    </p>
    {[
      { label: "Name", value: name },
      { label: "Signature" },
      { label: "Date" },
    ].map(({ label, value }) => (
      <div key={label} className="flex items-end gap-3 text-[13px]">
        <span className="w-18 shrink-0 text-[#7c5a5a]">{label}</span>
        <span className="min-h-6 flex-1 border-b border-[#1e1b1b] font-medium text-[#1e1b1b]">
          {value}
        </span>
      </div>
    ))}
  </div>
);

// Helper components for the web view
const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
      {label}
    </span>
    <span className="text-[14px] font-medium text-[#1e1b1b]">
      {value || "—"}
    </span>
  </div>
);

const SectionHeading = ({ title }: { title: string }) => (
  <h2 className="mb-5 text-[11px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
    {title}
  </h2>
);

const AccessPdfModal = ({ pdfData }: { pdfData: AccessPdfValues }) => {
  const [mounted, setMounted] = useState(false);
  const policy = getAccessPolicy(pdfData.termsversion);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  return (
    <div className="relative p-4 font-sans">
      <div className="relative z-10 mx-auto max-w-180">
        {/* Toolbar */}
        <div className="rounded-surface mb-6 flex flex-wrap items-center justify-between gap-4 border border-gray-100 bg-white/70 px-6 py-4 shadow-[0_8px_16px_rgba(160,60,60,0.06)]">
          <span className="text-[13px] font-medium text-[#7c5a5a]">
            Access Requisition - {pdfData.employeename}
          </span>

          {mounted ? (
            <PDFDownloadLink
              document={<AccessRequisitionPdf pdfData={pdfData} />}
              fileName={`Access_Requisition_${pdfData.employeename.replace(/\s+/g, "_")}.pdf`}
              className="rounded-control flex cursor-pointer items-center gap-2 border-none bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)]"
            >
              <Printer size={14} />
              <span>Download PDF</span>
            </PDFDownloadLink>
          ) : (
            <button
              disabled
              className="rounded-control flex cursor-not-allowed items-center gap-2 border-none bg-slate-700 px-5 py-2.5 text-[13px] font-semibold text-white/70"
            >
              <Printer size={14} />
              Download PDF
            </button>
          )}
        </div>

        {/* HTML Document Preview */}
        <div className="rounded-surface border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] sm:px-8">
          {/* Header */}
          <div className="mb-8 border-b border-[rgba(240,180,180,0.4)] pb-6">
            <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Access Requisition
            </h1>
            <p className="mt-1 text-[13px] wrap-break-word text-[#7c5a5a]">
              Submitted by: {pdfData.submittername} ({pdfData.submitteremail})
              on {dateFormatter(pdfData.datesubmitted)}
            </p>
          </div>

          {/* Employee Info */}
          <div className="mb-8">
            <SectionHeading title="Employee Details" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field label="Employee Name" value={pdfData.employeename} />
              <Field label="Staff Number" value={pdfData.employeestaffnumber} />
              <Field label="Department" value={pdfData.employeedepartment} />
              <Field label="Employee Status" value={pdfData.employeestatus} />
            </div>
          </div>

          {/* Request Info */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Request Details" />
            <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field
                label="Issuance Date"
                value={dateFormatter(pdfData.issuancedate)}
              />
            </div>

            {/* Locations / Access Level */}
            <div className="mb-6">
              <span className="mb-2 block text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                {ACCESS_LOCATIONS_LABEL}
              </span>
              <p className="text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                {pdfData.locations || "No locations specified"}
              </p>
            </div>

            {/* Requirements & Justification */}
            <div className="mb-6">
              <span className="mb-2 block text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                {ACCESS_REQUIREMENTS_LABEL}
              </span>
              <p className="text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                {pdfData.requirements ||
                  "No specific requirements/keys provided"}
              </p>
            </div>
          </div>

          {/* Approval Chain */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Approval Chain" />
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              {/* HOD Card */}
              <div className="rounded-surface border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                  HOD Approval
                </p>
                <p className="mb-3 text-[14px] font-semibold text-wrap text-[#1e1b1b]">
                  {pdfData.hodapprover || "—"}
                </p>
                <StatusFormatter status={pdfData.hodapprovalstatus} />
                {pdfData.hodcomments && (
                  <p className="mt-3 text-[12px] leading-relaxed text-wrap text-[#7c5a5a]">
                    &ldquo;{pdfData.hodcomments}&rdquo;
                  </p>
                )}
              </div>

              {/* Security Card */}
              <div className="rounded-surface border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                  Security Approval
                </p>
                <p className="mb-3 text-[14px] font-semibold text-wrap text-[#1e1b1b]">
                  {pdfData.securityapprover || "—"}
                </p>
                <StatusFormatter status={pdfData.securityapprovalstatus} />
                {pdfData.securitycomments && (
                  <p className="mt-3 text-[12px] leading-relaxed text-wrap text-[#7c5a5a]">
                    &ldquo;{pdfData.securitycomments}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key Custody & Access Policy, as agreed at submission */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Key Custody & Access Policy" />
            <AccessPolicyConditions policy={policy} />
          </div>

          {/* Acknowledgement and signatures */}
          <div className="border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Employee Acknowledgement" />
            <p className="text-[13px] leading-relaxed text-[#1e1b1b]">
              {employeeAcknowledgement(policy, pdfData.employeename)}
            </p>
            <p className="mt-2 text-[12px] text-[#7c5a5a]">
              Agreed to electronically by {pdfData.submittername} when
              submitting this requisition on{" "}
              {dateFormatter(pdfData.termsacceptedat)}.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-10 max-sm:grid-cols-1">
              <SignatureBlock title="Employee" name={pdfData.employeename} />
              <SignatureBlock title="Security Manager" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessPdfModal;
