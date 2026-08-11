import { Metadata } from "next";
import { Suspense } from "react";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";
import { query } from "@/lib/db";
import TravelApprovalModal from "@/components/Approvers/TravelApprovers/TravelApprovalModal";
import TravelApprovalSkeleton from "@/components/Skeletons/TravelApprovalSkeleton";
import AlreadyProcessed from "@/components/Approvers/TravelApprovers/AlreadyProcessed";
import InvalidToken from "@/components/Approvers/TravelApprovers/InvalidToken";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isValidTravelStage } from "@/public/assets";

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
  if (!isValidTravelStage(stage)) {
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
  if (!uuid || !token || !isValidTravelStage(stage)) return <NotFoundRequest />;

  const validApprover = await query(
    `SELECT ${stage}_email AS email, 
       ${stage}_name AS name 
       FROM ${stage}_array WHERE ${stage}_uuid = $1`,
    [token],
  );

  if (validApprover.length === 0) return <InvalidToken />;

  const approverDetails = validApprover[0];

  // Token is valid - lets query the database for the travel data
  const baseQuery = `
      SELECT
        travel_${stage}_approval_status AS approval_status,
        travel_${stage}_approver AS approver_name,
        request_created_at, employee_name, employee_department, 
        employee_designation, travel_destination, travel_departure_date, 
        travel_return_date, travel_category, travel_business_justification, 
        travel_mode, travel_transport_cost, travel_other_costs, 
        travel_per_diem, travel_total_cost, travel_cost_center, 
        travel_within_budget, travel_approval_tier,
        engineering_jobs 
        FROM travel_requisitions
        WHERE request_id = $1
      `;

  const result = await query(baseQuery, [uuid]);

  // Entered request uuid could not be found in our database
  if (result.length === 0) return <NotFoundRequest />;

  const requestData = result[0];

  // Director is only part of the chain for Tier 3 - a director-stage link
  // for a lower tier is not a valid request, regardless of token validity.
  if (stage === "director" && requestData.travel_approval_tier !== "Tier 3")
    return <NotFoundRequest />;

  // Check if request is already processed
  const approvalStatus = requestData.approval_status;
  const approverName = requestData.approver_name;

  if (approvalStatus !== "pending" && approvalStatus !== "N/A")
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
            <TravelApprovalModal
              uuid={uuid}
              stage={stage}
              approverName={currentApprover}
              approverEmail={currentApproverEmail}
              employeeName={requestData.employee_name}
              employeeDepartment={requestData.employee_department}
              employeeDesignation={requestData.employee_designation}
              travelDestination={requestData.travel_destination}
              travelDepartureDate={requestData.travel_departure_date}
              travelReturnDate={requestData.travel_return_date}
              travelCategory={requestData.travel_category}
              travelBusinessJustification={
                requestData.travel_business_justification
              }
              travelMode={requestData.travel_mode}
              travelTransportCost={requestData.travel_transport_cost}
              travelOtherCosts={requestData.travel_other_costs}
              travelPerDiem={requestData.travel_per_diem}
              travelTotalCost={requestData.travel_total_cost}
              travelCostCenter={requestData.travel_cost_center}
              travelWithinBudget={requestData.travel_within_budget}
              travelApprovalTier={requestData.travel_approval_tier}
              requestCreatedAt={requestData.request_created_at}
              engineeringJobs={requestData.engineering_jobs}
            />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
