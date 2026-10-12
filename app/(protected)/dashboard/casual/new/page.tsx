import { Metadata } from "next";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import CasualRequisitionForm from "@/components/Modules/Retail/CasualRequisitionForm";

export const metadata: Metadata = {
  title: "New Casual Requisition",
  description: "Submit a new casual requisition",
};

const page = () => {
  return (
    <RequisitionFormPage type="casual">
      <CasualRequisitionForm />
    </RequisitionFormPage>
  );
};

export default page;
