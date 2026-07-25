import { Metadata } from "next";
import { Suspense } from "react";
import { query } from "@/lib/db";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";
import InvalidToken from "@/components/Approvers/TravelApprovers/InvalidToken";
import AlreadyProcessed from "@/components/Approvers/TravelApprovers/AlreadyProcessed";
import AccessApprovalSkeleton from "@/components/Skeletons/AccessApprovalSkeleton";
import AccessApprovalModal, {
  AccessRequisitionData,
} from "@/components/Approvers/AccessApprovers/AccessApprovalModal";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isValidAccessStage } from "@/public/assets";

type ApprovalPageProps = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ token: string; stage: string }>;
};

// Generating page metadata
export const generateMetadata = async ({
  searchParams,
}: ApprovalPageProps): Promise<Metadata> => {
  const { stage } = await searchParams;

  // Validate stage early
  if (!isValidAccessStage(stage)) {
    return {
      title: "Review | Invalid Request",
      description: "Invalid or missing approval stage.",
    };
  }

  const upperCase = stage.toUpperCase(); // Safe to call: stage is typed as Stage here

  return {
    title: `Review | ${upperCase || "NO"} Stage`,
    description: `Review | ${upperCase || "NO"} Approval Stage`,
  };
};

const page = async ({ params, searchParams }: ApprovalPageProps) => {
  const { uuid } = await params;
  const { token, stage } = await searchParams;

  // First fallback - one of our props is missing/falsy
  if (!uuid || !token || !isValidAccessStage(stage)) return <NotFoundRequest />;

  const validApprover = await query(
    `SELECT ${stage}_email AS email, 
     ${stage}_name AS name 
     FROM ${stage}_array WHERE ${stage}_uuid = $1`,
    [token],
  );

  if (validApprover.length === 0) return <InvalidToken />;

  const approverDetails = validApprover[0];

  // Valid approval token - query the database for the IT requisition data
  const baseQuery = `
          SELECT
          request_created_at, submitter_email, submitter_name,
          employee_name, employee_department, employee_staff_number, 
          issuance_date, access_locations, access_requirements,
          ${stage}_approver_name AS approver_name, 
          ${stage}_approver_status AS approval_status
          FROM access_requisitions WHERE request_id = $1
          `;

  const result = await query(baseQuery, [uuid]);

  // Entered request uuid could not be found in our database
  if (result.length === 0) return <NotFoundRequest />;

  const requestData = result[0];

  // Check if request is already processed
  const approvalStatus = requestData.approval_status;
  const approverName = requestData.approver_name;

  if (approvalStatus !== "pending")
    return (
      <AlreadyProcessed processedBy={approverName} status={approvalStatus} />
    );

  const contextObject = {
    username: approverDetails.name,
    email: approverDetails.email,
    roles: [stage],
  };

  // Build the single data object passed to the modal
  const modalData: AccessRequisitionData = {
    uuid,
    stage,
    approverName: approverDetails.name,
    approverEmail: approverDetails.email,
    requestCreatedAt: requestData.request_created_at,
    submitterName: requestData.submitter_name,
    submitterEmail: requestData.submitter_email,
    employeeName: requestData.employee_name,
    employeeDepartment: requestData.employee_department,
    employeeStaffNumber: requestData.employee_staff_number,
    issuanceDate: requestData.issuance_date,
    accessLocations: requestData.access_locations,
    accessRequirements: requestData.access_requirements,
  };

  return (
    <UserProvider user={contextObject}>
      <DashboardWrapper>
        <RequisitionPagesWrapper>
          <Suspense fallback={<AccessApprovalSkeleton />}>
            <AccessApprovalModal data={modalData} />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
