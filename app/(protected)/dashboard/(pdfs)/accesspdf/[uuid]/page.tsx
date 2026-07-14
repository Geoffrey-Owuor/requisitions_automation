import {
  AccessDataQuery,
  AccessMailTemplateValues as PdfDataValues,
} from "@/services/AccessEmailSender";
import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import AccessPdfSkeleton from "@/components/Skeletons/AccessPdfSkeleton";
import AccessPdfModal from "@/components/Approvers/AccessApprovers/AccessPdfModal";
import { PdfDownloadProps } from "../../travelpdf/[uuid]/page";

export const metadata: Metadata = {
  title: "Access Requisition Pdf",
  description: "Download the Access requisition pdf",
};

const page = async ({ params }: PdfDownloadProps) => {
  const { uuid } = await params;

  if (!uuid) return <NotFoundRequest />;

  // Our query
  const result = await query<PdfDataValues>(AccessDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const pdfData = result[0];

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<AccessPdfSkeleton />}>
        <AccessPdfModal pdfData={pdfData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
