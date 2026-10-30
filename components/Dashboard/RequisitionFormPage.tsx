import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import RequisitionNavBar from "./RequisitionNavBar";
import RequisitionPagesWrapper from "./RequisitionPagesWrapper";

// Frame for a requisition form page (/dashboard/{type}/new and
// /dashboard/{type}/[requestId]/amend): the type area's sticky bar, whose
// action leads back to the type's tables, above the form, which brings its
// own heading.
const RequisitionFormPage = ({
  type,
  children,
}: {
  type: DashboardRequisitionType;
  children: React.ReactNode;
}) => {
  return (
    <RequisitionPagesWrapper
      header={<RequisitionNavBar type={type} mode="form" />}
    >
      <div className="p-2">{children}</div>
    </RequisitionPagesWrapper>
  );
};

export default RequisitionFormPage;
