import { Metadata } from "next";
import TravelRequisitionPage from "@/components/TravelRequisitionPage";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export const metadata: Metadata = {
  title: "Travel Requisition",
  description: "The Travel Requisition Page",
};

const page = () => {
  return (
    <RequisitionPagesWrapper>
      <TravelRequisitionPage />
    </RequisitionPagesWrapper>
  );
};

export default page;
