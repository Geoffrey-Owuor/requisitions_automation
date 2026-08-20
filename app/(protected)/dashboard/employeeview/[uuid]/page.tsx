import { Metadata } from "next";
import { Suspense } from "react";
import { getEmployeeEmailData } from "@/services/EmployeeEmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import EmployeeRequisitionViewModal from "@/components/Approvers/EmployeeApprovers/EmployeeRequisitionViewModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";

export type ViewRequisitionProps = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Employee Requisition",
  description: "View the employee requisition",
};

const page = async ({ params }: ViewRequisitionProps) => {
  const { uuid } = await params;

  if (!uuid) return <NotFoundRequest />;

  const viewData = await getEmployeeEmailData(uuid);

  if (!viewData?.emailaddress) return <NotFoundRequest />;

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <EmployeeRequisitionViewModal viewData={viewData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
