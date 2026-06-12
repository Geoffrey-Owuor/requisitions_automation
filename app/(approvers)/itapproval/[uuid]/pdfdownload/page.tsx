import {
  ITDataQuery,
  ITMailTemplateValues as PdfDataValues,
} from "@/services/ITEmailSender";
import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";
import ITReqPdfSkeleton from "@/components/Skeletons/ITReqPdfSkeleton";
import ITReqPdfModal from "@/components/Approvers/ITApprovers/ITReqPdfModal";
import { PdfDownloadProps } from "@/app/(approvers)/travelapproval/[uuid]/pdfdownload/page";

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

  const guestObject = {
    username: "Guest Account",
    email: "noreply@hotpoint.co.ke",
    roles: ["guest"],
  };

  return (
    <UserProvider user={guestObject}>
      <DashboardWrapper>
        <RequisitionPagesWrapper>
          <Suspense fallback={<ITReqPdfSkeleton />}>
            <ITReqPdfModal pdfData={pdfData} />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
