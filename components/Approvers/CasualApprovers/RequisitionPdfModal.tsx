"use client";
import { CasualEmailDataValues as CasualPdfValues } from "@/services/CasualEmailSender";
import { Printer } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { CasualRequisitionPdf } from "./pdf/CasualRequisitionPdf";
import { useEffect, useState } from "react";

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

const approvalStages = [
  {
    role: "HOD Approval",
    approverKey: "hodapprover" as const,
    emailKey: "hodemail" as const,
    statusKey: "hodapprovalstatus" as const,
    commentsKey: "hodcomments" as const,
  },
  {
    role: "Finance Approval",
    approverKey: "financeapprover" as const,
    emailKey: "financeemail" as const,
    statusKey: "financeapprovalstatus" as const,
    commentsKey: "financecomments" as const,
  },
  {
    role: "HR Approval",
    approverKey: "hrapprover" as const,
    emailKey: "hremail" as const,
    statusKey: "hrapprovalstatus" as const,
    commentsKey: "hrcomments" as const,
  },
];

const RequisitionPdfModal = ({ pdfData }: { pdfData: CasualPdfValues }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);
  const formatCost = (val: string | number) =>
    `KES ${Number(val).toLocaleString()}`;

  return (
    <div className="relative p-4 font-sans">
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Toolbar — hidden in print */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 px-6 py-4 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
          <span className="text-[13px] font-medium text-[#7c5a5a]">
            Casual Requisition - {pdfData.submittername}
          </span>
          {mounted ? (
            <PDFDownloadLink
              document={<CasualRequisitionPdf pdfData={pdfData} />}
              fileName={`Casual_Requisition_${pdfData.submittername.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("en-GB")}.pdf`}
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

        {/* Document */}
        <div
          id="printable-area"
          className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8"
        >
          {/* Doc header */}
          <div className="mb-8 border-b border-[rgba(240,180,180,0.4)] pb-6">
            <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Casual Requisition Form
            </h1>
            <p className="mt-1 text-[13px] text-[#7c5a5a]">
              Reference: {pdfData.emailaddress} - {pdfData.location}
            </p>
          </div>

          {/* Section 1: Submitter */}
          <div className="mb-8">
            <SectionHeading title="Submitter Details" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field label="Submitter" value={pdfData.submittername} />
              <Field label="Submitter Email" value={pdfData.emailaddress} />
              <Field label="Department" value={pdfData.department} />
              <Field label="Location" value={pdfData.location} />
              <Field label="HOD Approver" value={pdfData.hodapprover} />
            </div>
          </div>

          {/* Section 2: Engagement */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Engagement Information" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field
                label="Period From"
                value={dateFormatter(pdfData.periodfrom)}
              />
              <Field
                label="Period To"
                value={dateFormatter(pdfData.periodto)}
              />
              <Field label="Engagement Days" value={pdfData.engagementdays} />
              <Field
                label="Number of Casuals"
                value={pdfData.numberofcasuals}
              />
              {pdfData.hrapprovedcasuals !== null &&
                pdfData.hrapprovedcasuals !== undefined && (
                  <Field
                    label="HR Approved Casuals"
                    value={pdfData.hrapprovedcasuals}
                  />
                )}
            </div>

            {/* Justification */}
            <div className="mt-5">
              <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                Justification
              </span>
              <p className="mt-1.5 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                {pdfData.justification}
              </p>
            </div>

            {/* PPEs Required */}
            <div className="mt-5">
              <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
                PPEs Required
              </span>
              <p className="mt-1.5 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
                {pdfData.ppesrequired}
              </p>
            </div>
          </div>

          {/* Section 3: Rate Summary */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Rate Summary (KES)" />

            <div className="my-6 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/60 p-6">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Rate / Day", value: pdfData.rateperday },
                  {
                    label: "Engagement Days",
                    value: pdfData.engagementdays,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-[#7c5a5a]">{label}</span>
                    <span className="text-sm font-semibold text-[#1e1b1b]">
                      {label === "Engagement Days" ? value : formatCost(value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider + Total */}
              <div className="mt-4 border-t border-[rgba(240,180,180,0.4)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1e1b1b]">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-rose-700">
                    {formatCost(pdfData.totalamount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Approval Chain */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Approval Chain" />
            <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
              {approvalStages.map(
                ({ role, approverKey, emailKey, statusKey, commentsKey }) => (
                  <div
                    key={role}
                    className="rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 px-5 py-5"
                  >
                    <p className="mb-3 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
                      {role}
                    </p>
                    <p className="text-[14px] font-semibold text-wrap text-[#1e1b1b]">
                      {pdfData[approverKey] || "—"}
                    </p>
                    <p className="mb-3 max-w-50 truncate text-[12px] text-[#7c5a5a]">
                      {pdfData[emailKey] || "—"}
                    </p>
                    <StatusFormatter status={pdfData[statusKey]} />
                    {pdfData[commentsKey] && (
                      <p className="mt-3 text-[12px] leading-relaxed text-wrap text-[#7c5a5a]">
                        &ldquo;{pdfData[commentsKey]}&rdquo;
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[rgba(240,180,180,0.4)] pt-6 text-center">
            <p className="mt-0.5 text-[11px] text-[#b0a0a0]">
              This document is automatically generated. Unauthorized alterations
              are not permitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionPdfModal;
