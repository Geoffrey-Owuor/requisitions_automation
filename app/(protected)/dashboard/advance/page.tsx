import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import DashboardAdvanceWrapper from "@/components/SalaryAdvance/DashboardAdvanceWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotpoint Salary Advance",
  description: "Hotpoint salary advance page",
};

const page = () => {
  return (
    <RequisitionPagesWrapper>
      <DashboardAdvanceWrapper />
    </RequisitionPagesWrapper>
  );
};
export default page;
