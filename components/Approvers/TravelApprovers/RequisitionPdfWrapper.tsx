import { Suspense } from "react";
import { query } from "@/lib/db";
import {
  EmailDataValues as PdfDataValues,
  travelDataQuery,
} from "@/services/EmailSender";
import NotFoundRequest from "./NotFoundRequest";
import RequisitionPdfModal from "./RequisitionPdfModal";
import RequisitionPdfSkeleton from "@/components/Skeletons.tsx/RequisitionPdfSkeleton";

const RequisitionPdfWrapper = async ({ uuid }: { uuid: string }) => {
  if (!uuid) return <NotFoundRequest />;

  // Our query
  const result = await query<PdfDataValues>(travelDataQuery, [uuid]);

  if (result.length === 0) return <NotFoundRequest />;

  const pdfData = result[0];

  return (
    <Suspense fallback={<RequisitionPdfSkeleton />}>
      <RequisitionPdfModal pdfData={pdfData} />
    </Suspense>
  );
};

export default RequisitionPdfWrapper;
