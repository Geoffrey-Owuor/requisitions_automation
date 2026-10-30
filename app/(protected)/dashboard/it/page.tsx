import { Metadata } from "next";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import RequisitionTypeDashboard from "@/components/Dashboard/RequisitionTypeDashboard";
import RequisitionNavBar from "@/components/Dashboard/RequisitionNavBar";

export const metadata: Metadata = {
  title: "IT Requisitions",
  description: "Your IT requisitions, approvals and history",
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
      header={<RequisitionNavBar type="it" mode="tables" tab={tab} />}
    >
      <RequisitionTypeDashboard type="it" tab={tab} />
    </RequisitionPagesWrapper>
  );
};

export default page;
