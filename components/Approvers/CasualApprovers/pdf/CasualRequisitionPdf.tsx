"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import { CasualEmailDataValues as CasualPdfValues } from "@/services/CasualEmailSender";
import { dateFormatter } from "@/public/assets";

// Initialize Tailwind for React-PDF
const tw = createTw({
  theme: {
    extend: {
      colors: {
        rose: { 600: "#e11d48", 700: "#be123c" },
      },
    },
  },
});

// COMPACT PDF FIELD
const PdfField = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={tw("flex flex-col gap-0.5 w-[31%]")}>
    <Text style={tw("text-[8px] font-medium text-[#b0a0a0] uppercase")}>
      {label}
    </Text>
    <Text style={tw("text-[11px] font-medium text-[#1e1b1b]")}>
      {value || "—"}
    </Text>
  </View>
);

// COMPACT SECTION HEADING
const PdfSectionHeading = ({ title }: { title: string }) => (
  <Text style={tw("mb-2.5 text-[10px] font-semibold text-[#e11d48] uppercase")}>
    {title}
  </Text>
);

const approvalStages = [
  {
    role: "HOD Approval",
    approverKey: "hodapprover",
    emailKey: "hodemail",
    statusKey: "hodapprovalstatus",
    commentsKey: "hodcomments",
  },
  {
    role: "Finance Approval",
    approverKey: "financeapprover",
    emailKey: "financeemail",
    statusKey: "financeapprovalstatus",
    commentsKey: "financecomments",
  },
  {
    role: "HR Approval",
    approverKey: "hrapprover",
    emailKey: "hremail",
    statusKey: "hrapprovalstatus",
    commentsKey: "hrcomments",
  },
] as const;

export const CasualRequisitionPdf = ({
  pdfData,
}: {
  pdfData: CasualPdfValues;
}) => {
  const formatCost = (val: string | number) =>
    `KES ${Number(val).toLocaleString()}`;

  return (
    <Document>
      <Page size="A4" style={tw("py-8 px-8 bg-white")}>
        {/* Header */}
        <View style={tw("mb-5 border-b border-[#f0b4b4] pb-4")}>
          <Text style={tw("text-[18px] font-semibold text-[#1e1b1b]")}>
            Casual Requisition Form
          </Text>
          <Text style={tw("mt-1 text-[10px] text-[#7c5a5a]")}>
            Reference: {pdfData.emailaddress} - {pdfData.location}
          </Text>
        </View>

        {/* Submitter Details */}
        <View style={tw("mb-5")}>
          <PdfSectionHeading title="Submitter Details" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2")}>
            <PdfField label="Submitter" value={pdfData.submittername} />
            <PdfField label="Submitter Email" value={pdfData.emailaddress} />
            <PdfField label="Department" value={pdfData.department} />
            <PdfField label="Location" value={pdfData.location} />
            <PdfField label="HOD Approver" value={pdfData.hodapprover} />
          </View>
        </View>

        {/* Engagement Information */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Engagement Information" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2")}>
            <PdfField
              label="Period From"
              value={dateFormatter(pdfData.periodfrom)}
            />
            <PdfField
              label="Period To"
              value={dateFormatter(pdfData.periodto)}
            />
            <PdfField label="Engagement Days" value={pdfData.engagementdays} />
            <PdfField
              label="Number of Casuals"
              value={pdfData.numberofcasuals}
            />
            {pdfData.hrapprovedcasuals !== null &&
              pdfData.hrapprovedcasuals !== undefined && (
                <PdfField
                  label="HR Approved Casuals"
                  value={pdfData.hrapprovedcasuals}
                />
              )}
          </View>

          <View style={tw("mt-4")}>
            <Text
              style={tw(
                "text-[8px] font-medium break-words whitespace-pre-wrap text-[#b0a0a0] uppercase",
              )}
            >
              Justification
            </Text>
            <Text
              style={tw(
                "mt-1 text-[10px] leading-relaxed break-words whitespace-pre-wrap text-[#1e1b1b]",
              )}
            >
              {pdfData.justification}
            </Text>
          </View>

          <View style={tw("mt-4")}>
            <Text style={tw("text-[8px] font-medium text-[#b0a0a0] uppercase")}>
              PPEs Required
            </Text>
            <Text style={tw("mt-1 text-[10px] leading-relaxed text-[#1e1b1b]")}>
              {pdfData.ppesrequired}
            </Text>
          </View>
        </View>

        {/* Rate Summary */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Rate Summary (KES)" />

          <View
            style={tw("rounded-xl border border-[#f0b4b4] bg-[#fafafa] p-4")}
          >
            <View style={tw("flex flex-row justify-between mb-2")}>
              <Text style={tw("text-[10px] text-[#7c5a5a]")}>Rate / Day</Text>
              <Text style={tw("text-[10px] font-semibold text-[#1e1b1b]")}>
                {formatCost(pdfData.rateperday)}
              </Text>
            </View>
            <View style={tw("flex flex-row justify-between mb-2")}>
              <Text style={tw("text-[10px] text-[#7c5a5a]")}>
                Engagement Days
              </Text>
              <Text style={tw("text-[10px] font-semibold text-[#1e1b1b]")}>
                {pdfData.engagementdays}
              </Text>
            </View>

            <View
              style={tw(
                "mt-3 border-t border-[#f0b4b4] pt-3 flex flex-row justify-between",
              )}
            >
              <Text style={tw("font-semibold text-[10px] text-[#1e1b1b]")}>
                Total Amount
              </Text>
              <Text style={tw("text-[12px] font-bold text-[#be123c]")}>
                {formatCost(pdfData.totalamount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Approval Chain */}
        <View style={tw("mb-4 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Approval Chain" />
          <View style={tw("flex flex-row flex-wrap gap-3")}>
            {approvalStages.map(
              ({ role, approverKey, emailKey, statusKey, commentsKey }) => (
                <View
                  key={role}
                  style={tw(
                    "w-[31%] rounded-lg border border-[#f0b4b4] p-3 bg-[#fafafa]",
                  )}
                >
                  <Text
                    style={tw(
                      "mb-1.5 text-[8px] font-semibold text-[#b0a0a0] uppercase",
                    )}
                  >
                    {role}
                  </Text>
                  <Text
                    style={tw(
                      "text-[10px] font-semibold text-[#1e1b1b] mb-0.5",
                    )}
                  >
                    {pdfData[approverKey] || "—"}
                  </Text>
                  <Text style={tw("text-[8px] text-[#7c5a5a] mb-1.5")}>
                    {pdfData[emailKey] || "—"}
                  </Text>

                  <Text style={tw("text-[9px] font-bold uppercase")}>
                    {pdfData[statusKey] || "Pending"}
                  </Text>

                  {pdfData[commentsKey] && (
                    <Text
                      style={tw(
                        "mt-1.5 text-[9px] leading-relaxed text-[#7c5a5a]",
                      )}
                    >
                      &quot;{pdfData[commentsKey]}&quot;
                    </Text>
                  )}
                </View>
              ),
            )}
          </View>
        </View>

        {/* Footer Note */}
        <View style={tw("border-t border-[#f0b4b4] pt-4 mt-auto text-center")}>
          <Text style={tw("text-[9px] text-[#b0a0a0]")}>
            This document is automatically generated. Unauthorized alterations
            are not permitted.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
