import { Metadata } from "next";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import RequisitionTypeDashboard from "@/components/Dashboard/RequisitionTypeDashboard";
import RequisitionNavBar from "@/components/Dashboard/RequisitionNavBar";

export const metadata: Metadata = {
  title: "Employee Requisitions",
  description: "Your employee requisitions, approvals and history",
};

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) => {
  const { tab: tabParam } = await searchParams;
  const tab = typeof tabParam === "string" ? tabParam : undefined;
  return (
    <RequisitionPagesWrapper
      header={<RequisitionNavBar type="employee" mode="tables" tab={tab} />}
    >
      <RequisitionTypeDashboard type="employee" tab={tab} />
    </RequisitionPagesWrapper>
  );
};

export default page;
