"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import { ITMailTemplateValues as ITPdfValues } from "@/services/ITEmailSender";
import { dateFormatter } from "@/public/assets";

const tw = createTw({
  theme: {
    extend: {
      colors: {
        rose: { 600: "#e11d48", 700: "#be123c" },
        slate: { 100: "#f1f5f9", 700: "#334155" },
      },
    },
  },
});

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

const PdfSectionHeading = ({ title }: { title: string }) => (
  <Text style={tw("mb-2.5 text-[10px] font-semibold text-[#e11d48] uppercase")}>
    {title}
  </Text>
);

const ITRequisitionPdf = ({ pdfData }: { pdfData: ITPdfValues }) => {
  // Split requirements into an array, filtering out any empty strings
  const requirementsList = pdfData.requirements
    ? pdfData.requirements.split(", ").filter(Boolean)
    : [];

  return (
    <Document>
      <Page size="A4" style={tw("py-8 px-8 bg-white")}>
        {/* Header */}
        <View style={tw("mb-5 border-b border-[#f0b4b4] pb-4")}>
          <Text style={tw("text-[18px] font-semibold text-[#1e1b1b]")}>
            IT Equipment Requisition
          </Text>
          <Text style={tw("mt-1 text-[10px] text-[#7c5a5a]")}>
            Submitted by: {pdfData.submittername} on{" "}
            {dateFormatter(pdfData.datesubmitted)}
          </Text>
        </View>

        {/* Employee Details */}
        <View style={tw("mb-5")}>
          <PdfSectionHeading title="Employee Details" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2")}>
            <PdfField label="Employee Name" value={pdfData.employeename} />
            <PdfField
              label="Staff Number"
              value={pdfData.employeestaffnumber}
            />
            <PdfField label="Department" value={pdfData.employeedepartment} />
            <PdfField
              label="Joining Date"
              value={dateFormatter(pdfData.datejoining)}
            />
          </View>
        </View>

        {/* Request Details */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Request Details" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2 mb-4")}>
            <PdfField label="Request Type" value={pdfData.replacementnew} />
            <PdfField
              label="Requisition Date"
              value={dateFormatter(pdfData.requisitiondate)}
            />
          </View>

          {/* Requirements Badges */}
          <View style={tw("mb-4")}>
            <Text
              style={tw(
                "text-[8px] font-medium text-[#b0a0a0] uppercase mb-1.5",
              )}
            >
              Requested Items
            </Text>
            <View style={tw("flex flex-row flex-wrap gap-2")}>
              {requirementsList.length > 0 ? (
                requirementsList.map((req, index) => (
                  <View
                    key={index}
                    style={tw("rounded-md bg-slate-100 px-2 py-1")}
                  >
                    <Text style={tw("text-[9px] font-medium text-slate-700")}>
                      {req}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={tw("text-[10px] text-[#1e1b1b]")}>
                  No specific items selected
                </Text>
              )}
            </View>
          </View>

          {/* Other Requirements */}
          {pdfData.otherrequirements && (
            <View style={tw("mt-2")}>
              <Text
                style={tw("text-[8px] font-medium text-[#b0a0a0] uppercase")}
              >
                Other Requirements / Notes
              </Text>
              <Text
                style={tw(
                  "mt-1 text-[10px] leading-relaxed break-words whitespace-pre-wrap text-[#1e1b1b]",
                )}
              >
                {pdfData.otherrequirements}
              </Text>
            </View>
          )}
        </View>

        {/* Mandatory Approval Chain */}
        <View style={tw("mb-4 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Approval Chain" />
          <View style={tw("flex flex-row gap-4")}>
            {/* HOD Approver */}
            <View
              style={tw(
                "flex-1 rounded-lg border border-[#f0b4b4] p-3 bg-[#fafafa]",
              )}
            >
              <Text
                style={tw(
                  "mb-1.5 text-[8px] font-semibold text-[#b0a0a0] uppercase",
                )}
              >
                HOD Approval
              </Text>
              <Text
                style={tw("text-[10px] font-semibold text-[#1e1b1b] mb-1.5")}
              >
                {pdfData.hodapprover || "—"}
              </Text>
              <Text style={tw("text-[9px] font-bold uppercase")}>
                {pdfData.hodapprovalstatus || "Pending"}
              </Text>
              {pdfData.hodcomments && (
                <Text
                  style={tw("mt-1.5 text-[9px] leading-relaxed text-[#7c5a5a]")}
                >
                  &quot;{pdfData.hodcomments}&quot;
                </Text>
              )}
            </View>

            {/* IT Approver */}
            <View
              style={tw(
                "flex-1 rounded-lg border border-[#f0b4b4] p-3 bg-[#fafafa]",
              )}
            >
              <Text
                style={tw(
                  "mb-1.5 text-[8px] font-semibold text-[#b0a0a0] uppercase",
                )}
              >
                IT Approval
              </Text>
              <Text
                style={tw("text-[10px] font-semibold text-[#1e1b1b] mb-1.5")}
              >
                {pdfData.itapprover || "—"}
              </Text>
              <Text style={tw("text-[9px] font-bold uppercase")}>
                {pdfData.itapprovalstatus || "Pending"}
              </Text>
              {pdfData.itcomments && (
                <Text
                  style={tw("mt-1.5 text-[9px] leading-relaxed text-[#7c5a5a]")}
                >
                  &quot;{pdfData.itcomments}&quot;
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={tw("border-t border-[#f0b4b4] pt-4 mt-auto text-center")}>
          <Text style={tw("text-[9px] text-[#b0a0a0]")}>
            This is an automatically generated IT Requisition Document.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ITRequisitionPdf;
