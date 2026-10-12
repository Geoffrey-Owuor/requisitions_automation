import { Metadata } from "next";
import RequisitionFormPage from "@/components/Dashboard/RequisitionFormPage";
import EmployeeRequisitionForm from "@/components/Modules/Retail/EmployeeRequisitionForm";

export const metadata: Metadata = {
  title: "New Employee Requisition",
  description: "Submit a new employee requisition",
};

const page = () => {
  return (
    <RequisitionFormPage type="employee">
      <EmployeeRequisitionForm />
    </RequisitionFormPage>
  );
};

export default page;
