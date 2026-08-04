import { Metadata } from "next";
import { Suspense } from "react";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";
import { query } from "@/lib/db";
import CasualApprovalModal from "@/components/Approvers/CasualApprovers/CasualApprovalModal";
import TravelApprovalSkeleton from "@/components/Skeletons/TravelApprovalSkeleton";
import AlreadyProcessed from "@/components/Approvers/TravelApprovers/AlreadyProcessed";
import InvalidToken from "@/components/Approvers/TravelApprovers/InvalidToken";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isValidCasualStage } from "@/public/assets";

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
  if (!isValidCasualStage(stage)) {
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
  if (!uuid || !token || !isValidCasualStage(stage)) return <NotFoundRequest />;

  const validApprover = await query(
    `SELECT ${stage}_email AS email,
       ${stage}_name AS name
       FROM ${stage}_array WHERE ${stage}_uuid = $1`,
    [token],
  );

  if (validApprover.length === 0) return <InvalidToken />;

  const approverDetails = validApprover[0];

  // Token is valid - lets query the database for the casual requisition data
  const baseQuery = `
      SELECT
        casual_${stage}_approval_status AS approval_status,
        casual_${stage}_approver AS approver_name,
        request_created_at, submitter_name, submitter_email, employee_department,
        casual_location, casual_justification, number_of_casuals, ppes_required,
        engagement_period_from, engagement_period_to, engagement_days,
        casual_rate_per_day, casual_total_amount
        FROM casual_requisitions
        WHERE request_id = $1
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

  // Our current approver
  const currentApprover = approverDetails.name;
  const currentApproverEmail = approverDetails.email;

  // context object
  const contextObject = {
    username: currentApprover,
    email: currentApproverEmail,
    roles: [stage],
  };

  return (
    <UserProvider user={contextObject}>
      <DashboardWrapper>
        <RequisitionPagesWrapper>
          <Suspense fallback={<TravelApprovalSkeleton />}>
            <CasualApprovalModal
              uuid={uuid}
              stage={stage}
              approverName={currentApprover}
              approverEmail={currentApproverEmail}
              submitterName={requestData.submitter_name}
              submitterEmail={requestData.submitter_email}
              department={requestData.employee_department}
              location={requestData.casual_location}
              justification={requestData.casual_justification}
              numberOfCasuals={requestData.number_of_casuals}
              ppesRequired={requestData.ppes_required}
              periodFrom={requestData.engagement_period_from}
              periodTo={requestData.engagement_period_to}
              engagementDays={requestData.engagement_days}
              ratePerDay={requestData.casual_rate_per_day}
              totalAmount={requestData.casual_total_amount}
              requestCreatedAt={requestData.request_created_at}
            />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
