"use client";

import { ITMailTemplateValues as ITPdfValues } from "@/services/ITEmailSender";
import { Printer } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ITRequisitionPdf from "./pdf/ITRequisitionPdf";
import { useEffect, useState } from "react";

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

const ITReqPdfModal = ({ pdfData }: { pdfData: ITPdfValues }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  // Format requirements for the web view
  const requirementsList = pdfData.requirements
    ? pdfData.requirements.split(", ").filter(Boolean)
    : [];

  return (
    <div className="relative p-4 font-sans">
      <div className="relative z-10 mx-auto max-w-180">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 px-6 py-4 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
          <span className="text-[13px] font-medium text-[#7c5a5a]">
            IT Requisition - {pdfData.employeename}
          </span>

          {mounted ? (
            <PDFDownloadLink
              document={<ITRequisitionPdf pdfData={pdfData} />}
              fileName={`IT_Requisition_${pdfData.employeename.replace(/\s+/g, "_")}.pdf`}
              className="flex cursor-pointer items-center gap-2 rounded-[14px] border-none bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(225,29,72,0.3)]"
            >
              <Printer size={14} />
              <span>Download PDF</span>
            </PDFDownloadLink>
          ) : (
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-[14px] border-none bg-slate-700 px-5 py-2.5 text-[13px] font-semibold text-white/70"
            >
              <Printer size={14} />
              Download PDF
            </button>
          )}
        </div>

        {/* HTML Document Preview */}
        <div className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
          {/* Header */}
          <div className="mb-8 border-b border-[rgba(240,180,180,0.4)] pb-6">
            <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              IT Equipment Requisition
            </h1>
            <p className="mt-1 text-[13px] text-[#7c5a5a]">
              Submitted by: {pdfData.submittername} on{" "}
              {dateFormatter(pdfData.datesubmitted)}
            </p>
          </div>

          {/* Employee Info */}
          <div className="mb-8">
            <SectionHeading title="Employee Details" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field label="Employee Name" value={pdfData.employeename} />
              <Field label="Staff Number" value={pdfData.employeestaffnumber} />
              <Field label="Department" value={pdfData.employeedepartment} />
              <Field
                label="Joining Date"
                value={dateFormatter(pdfData.datejoining)}
              />
            </div>
          </div>

          {/* Request Info */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Request Details" />
            <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field label="Request Type" value={pdfData.replacementnew} />
              <Field
                label="Requisition Date"
                value={dateFormatter(pdfData.requisitiondate)}
              />
            </div>

            {/* Requirements Cards */}
            <div className="mb-6">
              <span className="mb-2 block text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                Requested Items
              </span>
              <div className="flex flex-wrap gap-2">
                {requirementsList.length > 0 ? (
                  requirementsList.map((req, index) => (
                    <span
                      key={index}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-[13px] font-medium text-slate-700"
                    >
                      {req}
                    </span>
                  ))
                ) : (
                  <span className="text-[13px] text-[#1e1b1b]">
                    No specific items selected
                  </span>
                )}
              </div>
            </div>

            {/* Other Requirements */}
            {pdfData.otherrequirements && (
              <div>
                <span className="mb-2 block text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                  Other Requirements / Notes
                </span>
                <p className="text-[13px] leading-relaxed text-[#1e1b1b]">
                  {pdfData.otherrequirements}
                </p>
              </div>
            )}
          </div>

          {/* Approval Chain */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Approval Chain" />
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              {/* HOD Card */}
              <div className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
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

              {/* IT Card */}
              <div className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                  IT Approval
                </p>
                <p className="mb-3 text-[14px] font-semibold text-wrap text-[#1e1b1b]">
                  {pdfData.itapprover || "—"}
                </p>
                <StatusFormatter status={pdfData.itapprovalstatus} />
                {pdfData.itcomments && (
                  <p className="mt-3 text-[12px] leading-relaxed text-wrap text-[#7c5a5a]">
                    &ldquo;{pdfData.itcomments}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITReqPdfModal;
