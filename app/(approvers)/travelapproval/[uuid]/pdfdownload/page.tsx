import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import {
  EmailDataValues as PdfDataValues,
  travelDataQuery,
} from "@/services/EmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import RequisitionPdfModal from "@/components/Approvers/TravelApprovers/RequisitionPdfModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";

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

  // Our query
  const result = await query<PdfDataValues>(travelDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const pdfData = result[0];

  const guestObject = {
    username: "Guest Account",
    email: "noreply@hotpoint.co.ke",
    roles: ["guest"],
  };

  return (
    <UserProvider user={guestObject}>
      <DashboardWrapper>
        <RequisitionPagesWrapper>
          <Suspense fallback={<RequisitionPdfSkeleton />}>
            <RequisitionPdfModal pdfData={pdfData} />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
