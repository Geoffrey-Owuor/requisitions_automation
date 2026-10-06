import { Metadata } from "next";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import RequisitionTypeDashboard from "@/components/Dashboard/RequisitionTypeDashboard";

export const metadata: Metadata = {
  title: "Key & Access Requisitions",
  description: "Your key & access requisitions, approvals and history",
};

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) => {
  const { tab } = await searchParams;
  return (
    <RequisitionPagesWrapper>
      <RequisitionTypeDashboard
        type="access"
        tab={typeof tab === "string" ? tab : undefined}
      />
    </RequisitionPagesWrapper>
  );
};

export default page;
