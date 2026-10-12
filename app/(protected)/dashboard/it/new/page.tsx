import { Metadata } from "next";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import ITRequisitionPage from "@/components/ITRequisition/ITRequisitionPage";

export const metadata: Metadata = {
  title: "New IT Requisition",
  description: "Submit a new IT requisition",
};

const page = () => {
  return (
    <RequisitionFormPage type="it">
      <ITRequisitionPage />
    </RequisitionFormPage>
  );
};

export default page;
