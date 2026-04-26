import { Metadata } from "next";
import RequisitionPdfWrapper from "@/components/Approvers/TravelApprovers/RequisitionPdfWrapper";

type PdfDownloadProps = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Travel Requisition Pdf",
  description: "Download the travel requisition pdf",
};
const page = async ({ params }: PdfDownloadProps) => {
  const { uuid } = await params;
  return <RequisitionPdfWrapper uuid={uuid} />;
};

export default page;
