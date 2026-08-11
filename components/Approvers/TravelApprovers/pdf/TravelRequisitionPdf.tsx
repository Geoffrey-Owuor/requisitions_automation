"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import { EmailDataValues as TravelPdfValues } from "@/services/EmailSender";
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
    role: "HR Approval",
    approverKey: "hrapprover",
    emailKey: "hremail",
    statusKey: "hrapprovalstatus",
    commentsKey: "hrcomments",
  },
  {
    role: "Director Approval",
    approverKey: "directorapprover",
    emailKey: "directoremail",
    statusKey: "directorapprovalstatus",
    commentsKey: "directorcomments",
  },
] as const;

const tierStageCount: Record<string, number> = {
  "Tier 1": 2,
  "Tier 2": 2,
  "Tier 3": 3,
};

export const TravelRequisitionPdf = ({
  pdfData,
}: {
  pdfData: TravelPdfValues;
}) => {
  const formatCost = (val: string | number) =>
    `KES ${Number(val).toLocaleString()}`;

  const visibleStages = approvalStages.slice(
    0,
    tierStageCount[pdfData.approvaltier] ?? 1,
  );

  // --- NEW: Parse Engineering Jobs for PDF ---
  let engineeringJobs: { title: string; amount: number }[] = [];
  let totalEngineeringCost = 0;

  if (pdfData.department === "Engineering & HVAC" && pdfData.engineeringjobs) {
    const lines = pdfData.engineeringjobs
      .split("\n")
      .filter((line) => line.trim() !== "");
    engineeringJobs = lines.map((line) => {
      const [title, amountString] = line.split(" - ");
      const amount = Number(amountString) || 0;
      totalEngineeringCost += amount;
      return { title: title?.trim() || "Unknown Job", amount };
    });
  }

  return (
    <Document>
      {/* Reduced padding from p-10 to py-8 px-8 */}
      <Page size="A4" style={tw("py-8 px-8 bg-white")}>
        {/* Header - Reduced text sizes and bottom margin */}
        <View style={tw("mb-5 border-b border-[#f0b4b4] pb-4")}>
          <Text style={tw("text-[18px] font-semibold text-[#1e1b1b]")}>
            Travel Requisition Form
          </Text>
          <Text style={tw("mt-1 text-[10px] text-[#7c5a5a]")}>
            Reference: {pdfData.emailaddress} - {pdfData.travelcategory} travel
            to {pdfData.destination}
          </Text>
        </View>

        {/* Employee Details - Reduced margin and gaps */}
        <View style={tw("mb-5")}>
          <PdfSectionHeading title="Employee Details" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2")}>
            <PdfField label="Employee Name" value={pdfData.employeename} />
            <PdfField label="Submitter Email" value={pdfData.emailaddress} />
            <PdfField label="Department" value={pdfData.department} />
            <PdfField label="Designation" value={pdfData.designation} />
            <PdfField label="Cost Centre" value={pdfData.costcentre} />
            <PdfField label="HOD Approver" value={pdfData.hodapprover} />
          </View>
        </View>

        {/* Trip Information - Halved border paddings/margins */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Trip Information" />
          <View style={tw("flex flex-row flex-wrap gap-y-3 gap-x-2")}>
            <PdfField label="Destination" value={pdfData.destination} />
            <PdfField
              label="Departure Date"
              value={dateFormatter(pdfData.departuredate)}
            />
            <PdfField
              label="Return Date"
              value={dateFormatter(pdfData.returndate)}
            />
            <PdfField label="Travel Category" value={pdfData.travelcategory} />
            <PdfField
              label="Mode of Transport"
              value={pdfData.modeoftransport}
            />
            <PdfField label="Within Budget?" value={pdfData.withinbudget} />
          </View>

          <View style={tw("mt-4")}>
            <Text style={tw("text-[8px] font-medium text-[#b0a0a0] uppercase")}>
              Business Justification
            </Text>
            <Text style={tw("mt-1 text-[10px] leading-relaxed text-[#1e1b1b]")}>
              {pdfData.businessjustification}
            </Text>
          </View>
        </View>

        {/* Costs - Reduced padding inside the card */}
        <View style={tw("mb-5 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Estimated Costs (KES)" />

          {/* --- NEW: Engineering Job Allocations PDF Card --- */}
          {pdfData.department === "Engineering & HVAC" &&
            engineeringJobs.length > 0 && (
              <View
                style={tw(
                  "mb-3 rounded-xl border border-[#f0b4b4] bg-[#fafafa] p-3",
                )}
              >
                <Text
                  style={tw(
                    "mb-2 text-[9px] font-bold text-[#e11d48] uppercase",
                  )}
                >
                  Engineering Job Allocations
                </Text>

                {engineeringJobs.map((job, idx) => (
                  <View
                    key={idx}
                    style={tw("flex flex-row justify-between pb-1.5 mb-1.5")}
                  >
                    <Text style={tw("text-[10px] text-[#7c5a5a]")}>
                      {job.title}
                    </Text>
                    <Text
                      style={tw("text-[10px] font-semibold text-[#1e1b1b]")}
                    >
                      {formatCost(job.amount)}
                    </Text>
                  </View>
                ))}

                <View
                  style={tw(
                    "flex flex-row border-t border-[#f0b4b4] justify-between pt-3 mt-3",
                  )}
                >
                  <Text style={tw("text-[10px] text-[#1e1b1b] font-semibold")}>
                    Allocations Subtotal
                  </Text>
                  <Text style={tw("text-[12px] font-bold text-[#be123c]")}>
                    {formatCost(totalEngineeringCost)}
                  </Text>
                </View>
              </View>
            )}

          {/* Regular Budget Summary */}
          <View
            style={tw("rounded-xl border border-[#f0b4b4] bg-[#fafafa] p-4")}
          >
            <Text
              style={tw("mb-3 text-[9px] font-bold text-[#e11d48] uppercase")}
            >
              Budget Summary
            </Text>

            <View style={tw("flex flex-row justify-between mb-2")}>
              <Text style={tw("text-[10px] text-[#7c5a5a]")}>
                Transport Cost (2-way)
              </Text>
              <Text style={tw("text-[10px] font-semibold text-[#1e1b1b]")}>
                {formatCost(pdfData.twowaytransportcost)}
              </Text>
            </View>
            <View style={tw("flex flex-row justify-between mb-2")}>
              <Text style={tw("text-[10px] text-[#7c5a5a]")}>Other Costs</Text>
              <Text style={tw("text-[10px] font-semibold text-[#1e1b1b]")}>
                {formatCost(pdfData.othercosts)}
              </Text>
            </View>
            <View style={tw("flex flex-row justify-between mb-2")}>
              <Text style={tw("text-[10px] text-[#7c5a5a]")}>
                Per Diem Entitlement
              </Text>
              <Text style={tw("text-[10px] font-semibold text-[#1e1b1b]")}>
                {formatCost(pdfData.perdiempolicy)}
              </Text>
            </View>

            <View
              style={tw(
                "mt-3 border-t border-[#f0b4b4] pt-3 flex flex-row justify-between",
              )}
            >
              <Text style={tw("font-semibold text-[10px] text-[#1e1b1b]")}>
                Total Cost
              </Text>
              <Text style={tw("text-[12px] font-bold text-[#be123c]")}>
                {formatCost(pdfData.estimatedcost)}
              </Text>
            </View>
          </View>
        </View>

        {/* Approval Chain - Reduced card paddings and text scaling */}
        <View style={tw("mb-4 border-t border-[#f0b4b4] pt-4")}>
          <PdfSectionHeading title="Approval Chain" />
          <View style={tw("flex flex-row flex-wrap gap-3")}>
            {visibleStages.map(
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
