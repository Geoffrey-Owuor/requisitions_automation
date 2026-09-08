import { Metadata } from "next";
import { Suspense } from "react";
import { getEmployeeEmailData } from "@/services/EmployeeEmailSender";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import EmployeeRequisitionViewModal from "@/components/Approvers/EmployeeApprovers/EmployeeRequisitionViewModal";
import RequisitionPdfSkeleton from "@/components/Skeletons/RequisitionPdfSkeleton";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { getSession } from "@/lib/session";
import { isEmployeeRequisitionApprover } from "@/lib/employeeApproverAccess";

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

  // Session is guaranteed by the (protected)/dashboard layout, but ownership
  // is not — restrict to the submitter or an approver this requisition has
  // actually reached (mirrors dashboard queue visibility).
  const session = await getSession();
  const isOwner = session?.email === viewData.emailaddress;
  const isApprover =
    !isOwner &&
    !!session &&
    (await isEmployeeRequisitionApprover(session.email, {
      hodEmail: viewData.hodemail,
      hodApprovalStatus: viewData.hodapprovalstatus,
      retailDirectorApprovalStatus: viewData.retaildirectorapprovalstatus,
      directorApprovalStatus: viewData.directorapprovalstatus,
    }));

  if (!isOwner && !isApprover) return <NotFoundRequest />;

  return (
    <RequisitionPagesWrapper>
      <Suspense fallback={<RequisitionPdfSkeleton />}>
        <EmployeeRequisitionViewModal viewData={viewData} />
      </Suspense>
    </RequisitionPagesWrapper>
  );
};

export default page;
