"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import { AccessMailTemplateValues as AccessPdfValues } from "@/services/AccessEmailSender";
import { dateFormatter } from "@/public/assets";
import {
  ACCESS_LOCATIONS_LABEL,
  ACCESS_REQUIREMENTS_LABEL,
  employeeAcknowledgement,
  getAccessPolicy,
} from "@/lib/accessRequisition";

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

// One signatory's lines; a blank name is filled in by hand
const PdfSignatureBlock = ({
  title,
  name,
}: {
  title: string;
  name?: string;
}) => (
  <View style={tw("flex-1")}>
    <Text style={tw("mb-3 text-[8px] font-semibold text-[#b0a0a0] uppercase")}>
      {title}
    </Text>
    {[
      { label: "Name", value: name },
      { label: "Signature" },
      { label: "Date" },
    ].map(({ label, value }) => (
      <View key={label} style={tw("mb-4 flex flex-row items-end")}>
        <Text style={tw("w-[60px] text-[9px] text-[#7c5a5a]")}>{label}</Text>
        <View style={tw("flex-1 border-b border-[#1e1b1b] pb-0.5")}>
          <Text style={tw("text-[10px] text-[#1e1b1b]")}>{value ?? " "}</Text>
        </View>
      </View>
    ))}
  </View>
);

const AccessRequisitionPdf = ({ pdfData }: { pdfData: AccessPdfValues }) => {
  const policy = getAccessPolicy(pdfData.termsversion);

  return (
    <Document>
      <Page size="A4" style={tw("py-8 px-8 bg-white")}>
        {/* Header */}
        <View style={tw("mb-5 border-b border-[#f0b4b4] pb-4")}>
          <Text style={tw("text-[18px] font-semibold text-[#1e1b1b]")}>
            Access Requisition
          </Text>
          <Text style={tw("mt-1 text-[10px] text-[#7c5a5a]")}>
            Submitted by: {pdfData.submittername} ({pdfData.submitteremail}) on{" "}
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
            <PdfField label="Employee Status" value={pdfData.employeestatus} />
          </View>
        </View>

        {/* Request Details */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Request Details" />

          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2 mb-4")}>
            <PdfField
              label="Issuance Date"
              value={dateFormatter(pdfData.issuancedate)}
            />
          </View>

          {/* Locations */}
          <View style={tw("mb-4")}>
            <Text
              style={tw(
                "text-[8px] font-medium text-[#b0a0a0] uppercase mb-1.5",
              )}
            >
              {ACCESS_LOCATIONS_LABEL}
            </Text>
            <Text style={tw("text-[10px] leading-relaxed text-[#1e1b1b]")}>
              {pdfData.locations || "No locations specified"}
            </Text>
          </View>

          {/* Requirements / Permissions */}
          <View style={tw("mt-2")}>
            <Text style={tw("text-[8px] font-medium text-[#b0a0a0] uppercase")}>
              {ACCESS_REQUIREMENTS_LABEL}
            </Text>
            <Text style={tw("mt-1 text-[10px] leading-relaxed text-[#1e1b1b]")}>
              {pdfData.requirements || "No specific requirements/keys provided"}
            </Text>
          </View>
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

            {/* Security Approver */}
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
                Security Approval
              </Text>
              <Text
                style={tw("text-[10px] font-semibold text-[#1e1b1b] mb-1.5")}
              >
                {pdfData.securityapprover || "—"}
              </Text>
              <Text style={tw("text-[9px] font-bold uppercase")}>
                {pdfData.securityapprovalstatus || "Pending"}
              </Text>
              {pdfData.securitycomments && (
                <Text
                  style={tw("mt-1.5 text-[9px] leading-relaxed text-[#7c5a5a]")}
                >
                  &quot;{pdfData.securitycomments}&quot;
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Key Custody & Access Policy, as agreed at submission */}
        <View style={tw("mb-4 border-t border-[#f0b4b4] pt-4")}>
          <View minPresenceAhead={60}>
            <PdfSectionHeading title="Key Custody & Access Policy" />
          </View>
          <Text style={tw("mb-2 text-[10px] font-semibold text-[#1e1b1b]")}>
            {policy.intro}
          </Text>
          {policy.conditions.map((condition, index) => (
            <View key={condition} style={tw("mb-1 flex flex-row")}>
              <Text style={tw("w-[16px] text-[9px] text-[#5c4a4a]")}>
                {index + 1}.
              </Text>
              <Text
                style={tw("flex-1 text-[9px] leading-relaxed text-[#5c4a4a]")}
              >
                {condition}
              </Text>
            </View>
          ))}
          <Text style={tw("mt-2 text-[9px] font-semibold text-rose-700")}>
            {policy.warning}
          </Text>
        </View>

        {/* Acknowledgement and signatures stay together on one page */}
        <View wrap={false} style={tw("mb-4 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Employee Acknowledgement" />
          <Text style={tw("text-[10px] leading-relaxed text-[#1e1b1b]")}>
            {employeeAcknowledgement(policy, pdfData.employeename)}
          </Text>
          <Text style={tw("mt-2 text-[8px] text-[#7c5a5a]")}>
            Agreed to electronically by {pdfData.submittername} when submitting
            this requisition on {dateFormatter(pdfData.termsacceptedat)}.
          </Text>

          <View style={tw("mt-6 flex flex-row gap-8")}>
            <PdfSignatureBlock title="Employee" name={pdfData.employeename} />
            <PdfSignatureBlock title="Security Manager" />
          </View>
        </View>

        {/* Footer */}
        <View style={tw("border-t border-[#f0b4b4] pt-4 mt-auto text-center")}>
          <Text style={tw("text-[9px] text-[#b0a0a0]")}>
            This is an automatically generated Access Requisition Document.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default AccessRequisitionPdf;
