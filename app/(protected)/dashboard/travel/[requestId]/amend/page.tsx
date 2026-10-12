import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/uuid";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import TravelRequisitionPage from "@/components/TravelRequisitionPage";

type AmendPageProps = { params: Promise<{ requestId: string }> };

// not-found files can't export metadata, but a page that calls notFound()
// still contributes its own - so a malformed id gets the 404's title here
export async function generateMetadata({
  params,
}: AmendPageProps): Promise<Metadata> {
  const { requestId } = await params;
  if (!isUuid(requestId)) return NOT_FOUND_METADATA;
  return {
    title: "Amend Travel Requisition",
    description: "Amend a travel requisition you submitted",
  };
}

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
