import { Metadata } from "next";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import KeyAccessRequisitionForm from "@/components/Modules/Retail/KeyAccessRequisitionForm";

export const metadata: Metadata = {
  title: "New Key & Access Requisition",
  description: "Submit a new key & access requisition",
};

const page = () => {
  return (
    <RequisitionFormPage type="access">
      <KeyAccessRequisitionForm />
    </RequisitionFormPage>
  );
};

export default page;
