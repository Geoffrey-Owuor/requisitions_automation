import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import {
  CasualEmailDataValues as PdfDataValues,
  CasualSectionValues,
  casualDataQuery,
  casualSectionsQuery,
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
    Omit<PdfDataValues, "sections" | "totalamount" | "totalcasuals">
  >(casualDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const sections = await query<CasualSectionValues>(casualSectionsQuery, [
    uuid,
  ]);

  // Get the HR Approved casuals
  const totalHrApprovedCasuals = sections.reduce(
    (sum, s) => sum + (s.hrapprovedcasuals ?? 0),
    0,
  );

  // Get the initial number of casuals
  const totalInitialCasuals = sections.reduce(
    (sum, s) => sum + s.numberofcasuals,
    0,
  );
  const totalcasuals =
    totalHrApprovedCasuals === totalInitialCasuals ||
    totalHrApprovedCasuals === 0
      ? totalInitialCasuals
      : totalHrApprovedCasuals;

  const pdfData: PdfDataValues = {
    ...result[0],
    sections,
    totalamount: sections.reduce((sum, s) => sum + s.totalamount, 0),
    totalcasuals: totalcasuals,
  };

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <RequisitionPdfModal pdfData={pdfData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
