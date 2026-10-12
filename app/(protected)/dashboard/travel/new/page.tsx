import { Metadata } from "next";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import TravelRequisitionPage from "@/components/TravelRequisitionPage";

export const metadata: Metadata = {
  title: "New Travel Requisition",
  description: "Submit a new travel requisition",
};

const page = () => {
  return (
    <RequisitionFormPage type="travel">
      <TravelRequisitionPage />
    </RequisitionFormPage>
  );
};

export default page;
