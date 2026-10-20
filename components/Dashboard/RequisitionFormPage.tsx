import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import { getRequisitionType, myRequisitionsHref } from "@/lib/dashboardTables";
import RequisitionPagesWrapper from "./RequisitionPagesWrapper";

// Frame for a requisition form page (/dashboard/{type}/new and
// /dashboard/{type}/[requestId]/amend): a link back to the type's tables
// above the form, which brings its own heading.
const RequisitionFormPage = ({
  type,
  children,
}: {
  type: DashboardRequisitionType;
  children: React.ReactNode;
}) => {
  const { label } = getRequisitionType(type);

  return (
    <RequisitionPagesWrapper>
      <div className="p-2">
        <Link
          href={myRequisitionsHref(type)}
          className="rounded-compact inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {label} Requisitions
        </Link>
        {children}
      </div>
    </RequisitionPagesWrapper>
  );
};

export default RequisitionFormPage;
