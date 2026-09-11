import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import {
  CasualEmailDataValues as PdfDataValues,
  CasualSectionValues,
  CasualAmendmentValues,
  casualDataQuery,
  casualSectionsQuery,
  casualAmendmentsQuery,
} from "@/services/CasualEmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import RequisitionPdfModal from "@/components/Approvers/CasualApprovers/RequisitionPdfModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export type PdfDownloadProps = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Casual Requisition Pdf",
  description: "Download the casual requisition pdf",
};

const page = async ({ params }: PdfDownloadProps) => {
  const { uuid } = await params;

  if (!uuid) return <NotFoundRequest />;

  // Our query
  const result = await query<
    Omit<PdfDataValues, "sections" | "amendments" | "totalamount" | "totalcasuals">
  >(casualDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const [sections, amendments] = await Promise.all([
    query<CasualSectionValues>(casualSectionsQuery, [uuid]),
    query<CasualAmendmentValues>(casualAmendmentsQuery, [uuid]),
  ]);

  const pdfData: PdfDataValues = {
    ...result[0],
    sections,
    amendments,
    totalamount: sections.reduce((sum, s) => sum + s.totalamount, 0),
    totalcasuals: sections.reduce((sum, s) => sum + s.numberofcasuals, 0),
  };

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <RequisitionPdfModal pdfData={pdfData} requestId={uuid} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
