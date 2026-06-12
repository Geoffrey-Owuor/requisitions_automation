import { Metadata } from "next";
import ITRequisitionPage from "@/components/ITRequisition/ITRequisitionPage";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export const metadata: Metadata = {
  title: "IT Requisition",
  description: "The IT Requisition Page",
};

const page = () => {
  return (
    <RequisitionPagesWrapper>
      <ITRequisitionPage />
    </RequisitionPagesWrapper>
  );
};

export default page;
