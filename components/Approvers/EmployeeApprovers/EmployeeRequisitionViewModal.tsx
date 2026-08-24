"use client";

import { EmployeeEmailDataValues } from "@/services/EmployeeEmailSender";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";
import AttachmentLink from "./AttachmentLink";

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
    role: "CEO Approval",
    approverKey: "directorapprover" as const,
    emailKey: "directoremail" as const,
    statusKey: "directorapprovalstatus" as const,
    commentsKey: "directorcomments" as const,
  },
  {
    role: "HR Approval",
    approverKey: "hrapprover" as const,
    emailKey: "hremail" as const,
    statusKey: "hrapprovalstatus" as const,
    commentsKey: "hrcomments" as const,
  },
];

const PositionCard = ({
  position,
}: {
  position: EmployeeEmailDataValues["positions"][number];
}) => (
  <div className="mb-4 rounded-2xl border border-[rgba(240,180,180,0.4)] bg-white/60 p-5">
    <h3 className="mb-3 text-[13px] font-semibold text-[#1e1b1b]">
      {position.positiontitle}
    </h3>
    <div className="mb-4 grid grid-cols-3 gap-x-6 gap-y-4 max-sm:grid-cols-1">
      <Field label="Number Required" value={position.numberrequired} />
      <Field label="Reporting To" value={position.reportingto} />
      <Field
        label="Date To Be Filled"
        value={dateFormatter(position.datefilled)}
      />
    </div>

    <div className="mb-4">
      <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
        Justification
      </span>
      <p className="mt-1.5 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-[#1e1b1b]">
        {position.justification}
      </p>
    </div>

    <div>
      <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
        Attachments
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {position.attachments.map((attachment) => (
          <AttachmentLink
            key={attachment.attachmentid}
            attachmentId={attachment.attachmentid}
            label={attachment.originalfilename}
          />
        ))}
      </div>
    </div>
  </div>
);

const EmployeeRequisitionViewModal = ({
  viewData,
}: {
  viewData: EmployeeEmailDataValues;
}) => {
  return (
    <div className="relative p-4 font-sans">
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 px-6 py-4 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
          <span className="text-[13px] font-medium text-[#7c5a5a]">
            Employee Requisition - {viewData.submittername}
          </span>
        </div>

        {/* Document */}
        <div className="rounded-3xl border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] backdrop-blur-2xl sm:px-8">
          {/* Doc header */}
          <div className="mb-8 border-b border-[rgba(240,180,180,0.4)] pb-6">
            <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Employee Requisition Form
            </h1>
            <p className="mt-1 text-[13px] text-[#7c5a5a]">
              Reference: {viewData.emailaddress}
            </p>
          </div>

          {/* Section 1: Submitter */}
          <div className="mb-8">
            <SectionHeading title="Submitter Details" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-sm:grid-cols-1">
              <Field label="Submitter" value={viewData.submittername} />
              <Field label="Submitter Email" value={viewData.emailaddress} />
              <Field label="Department" value={viewData.department} />
              <Field label="HOD Approver" value={viewData.hodapprover} />
            </div>
          </div>

          {/* Section 2: Positions */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Positions" />
            {viewData.positions.map((position) => (
              <PositionCard key={position.positionid} position={position} />
            ))}
          </div>

          {/* Section 3: Overall Summary */}
          <div className="mb-8 border-t border-[rgba(240,180,180,0.4)] pt-8">
            <SectionHeading title="Overall Summary" />

            <div className="my-6 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#7c5a5a]">
                  Positions Requested
                </span>
                <span className="text-sm font-semibold text-[#1e1b1b]">
                  {viewData.totalpositions}
                </span>
              </div>

              <div className="mt-4 border-t border-[rgba(240,180,180,0.4)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1e1b1b]">
                    Total Headcount Requested
                  </span>
                  <span className="text-lg font-bold text-rose-700">
                    {viewData.totalnumberrequired}
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
                      {viewData[approverKey] || "—"}
                    </p>
                    <p className="mb-3 max-w-50 truncate text-[12px] text-[#7c5a5a]">
                      {viewData[emailKey] || "—"}
                    </p>
                    <StatusFormatter status={viewData[statusKey]} />
                    {viewData[commentsKey] && (
                      <p className="mt-3 text-[12px] leading-relaxed text-wrap text-[#7c5a5a]">
                        &ldquo;{viewData[commentsKey]}&rdquo;
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

export default EmployeeRequisitionViewModal;
