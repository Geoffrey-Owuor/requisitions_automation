import { Metadata } from "next";
import { Suspense } from "react";
import { getTravelRequisitionData } from "@/services/EmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isUuid } from "@/lib/uuid";
import { getSession } from "@/lib/session";
import { canViewRequisition } from "@/lib/requisitionAccess";
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

  // request_id is a uuid column: Postgres throws on malformed input
  if (!isUuid(uuid)) return <NotFoundRequest />;

  // A session is guaranteed by the dashboard layout, but not that it may see
  // this requisition: unknown and off-limits look the same
  const session = await getSession();
  if (!session || !(await canViewRequisition("travel", uuid, session.email))) {
    return <NotFoundRequest />;
  }

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
