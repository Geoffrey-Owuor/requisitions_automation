import {
  ITDataQuery,
  ITMailTemplateValues as PdfDataValues,
} from "@/services/ITEmailSender";
import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import ITReqPdfSkeleton from "@/components/Skeletons/ITReqPdfSkeleton";
import ITReqPdfModal from "@/components/Approvers/ITApprovers/ITReqPdfModal";
import { PdfDownloadProps } from "../../travelpdf/[uuid]/page";

export const metadata: Metadata = {
  title: "IT Requisition Pdf",
  description: "Download the IT requisition pdf",
};

const page = async ({ params }: PdfDownloadProps) => {
  const { uuid } = await params;

  if (!uuid) return <NotFoundRequest />;

  // Our query
  const result = await query<PdfDataValues>(ITDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const pdfData = result[0];

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<ITReqPdfSkeleton />}>
        <ITReqPdfModal pdfData={pdfData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
