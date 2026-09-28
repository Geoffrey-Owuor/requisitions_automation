import { Metadata } from "next";
import { Suspense } from "react";
import { getTravelRequisitionData } from "@/services/EmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import RequisitionPdfModal from "@/components/Approvers/TravelApprovers/RequisitionPdfModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export type PdfDownloadProps = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Travel Requisition Pdf",
  description: "Download the travel requisition pdf",
};

const page = async ({ params }: PdfDownloadProps) => {
  const { uuid } = await params;

  if (!uuid) return <NotFoundRequest />;

  // Requisition plus its HR push-back history
  const pdfData = await getTravelRequisitionData(uuid);

  if (!pdfData) return <NotFoundRequest />;

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <RequisitionPdfModal pdfData={pdfData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
