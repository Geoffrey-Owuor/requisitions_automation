import { Metadata } from "next";
import { Suspense } from "react";
import { getEmployeeEmailData } from "@/services/EmployeeEmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isUuid } from "@/lib/uuid";
import EmployeeRequisitionViewModal from "@/components/Approvers/EmployeeApprovers/EmployeeRequisitionViewModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { getSession } from "@/lib/session";
import { canViewRequisition } from "@/lib/requisitionAccess";

export type ViewRequisitionProps = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Employee Requisition",
  description: "View the employee requisition",
};

const page = async ({ params }: ViewRequisitionProps) => {
  const { uuid } = await params;

  // request_id is a uuid column: Postgres throws on malformed input
  if (!isUuid(uuid)) return <NotFoundRequest />;

  const viewData = await getEmployeeEmailData(uuid);

  if (!viewData?.emailaddress) return <NotFoundRequest />;

  // Session is guaranteed by the (protected)/dashboard layout, but not that
  // it may see this requisition (lib/requisitionAccess.ts)
  const session = await getSession();
  if (
    !session ||
    !(await canViewRequisition("employee", uuid, session.email))
  ) {
    return <NotFoundRequest />;
  }

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <EmployeeRequisitionViewModal viewData={viewData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
