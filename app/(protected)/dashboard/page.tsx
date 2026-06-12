import UserDashboard from "@/components/Dashboard/UserDashboard";
import { Metadata } from "next";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User requisitions dashboard",
};
const page = () => {
  return (
    <RequisitionPagesWrapper>
      <UserDashboard />
    </RequisitionPagesWrapper>
  );
};

export default page;
