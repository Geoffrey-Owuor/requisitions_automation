import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/uuid";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import TravelRequisitionPage from "@/components/TravelRequisitionPage";

type AmendPageProps = { params: Promise<{ requestId: string }> };

export const metadata: Metadata = {
  title: "Amend Travel Requisition",
  description: "Amend a travel requisition you submitted",
};

// Ownership and amendability are checked by the form's amendment context
// action and again by the amendment route - this page only rejects ids that
// can't be a requisition
const page = async ({ params }: AmendPageProps) => {
  const { requestId } = await params;
  if (!isUuid(requestId)) notFound();

  return (
    <RequisitionFormPage type="travel">
      <TravelRequisitionPage key={requestId} amendRequestId={requestId} />
    </RequisitionFormPage>
  );
};

export default page;
