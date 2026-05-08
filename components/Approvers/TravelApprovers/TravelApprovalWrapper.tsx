import { Suspense } from "react";
import { query } from "@/lib/db";
import { HOD_ARRAY, HR_ARRAY, DIRECTOR_ARRAY } from "@/secretAssets";
import TravelApprovalModal from "./TravelApprovalModal";
import TravelApprovalSkeleton from "@/components/Skeletons/TravelApprovalSkeleton";
import AlreadyProcessed from "./AlreadyProcessed";
import InvalidToken from "./InvalidToken";
import NotFoundRequest from "./NotFoundRequest";

type TravelApprovalWrapperProps = {
  uuid: string;
  token: string;
  stage: string;
};
const TravelApprovalWrapper = async ({
  uuid,
  token,
  stage,
}: TravelApprovalWrapperProps) => {
  // First fallback - one of our props is missing/falsy
  if (!uuid || !token || !stage) return <NotFoundRequest />;

  // Which approver are we looking for (HOD or HR or Director)
  let APPROVERS_ARRAY;

  switch (stage) {
    case "hod":
      APPROVERS_ARRAY = HOD_ARRAY;
      break;
    case "hr":
      APPROVERS_ARRAY = HR_ARRAY;
      break;
    case "director":
      APPROVERS_ARRAY = DIRECTOR_ARRAY;
      break;
    default: //Assign default array to directors
      APPROVERS_ARRAY = DIRECTOR_ARRAY;
      break;
  }

  const approverObject = APPROVERS_ARRAY.find(
    (approver) => approver.uuid === token,
  );

  if (!approverObject) return <InvalidToken />;

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
    travel_within_budget, travel_approval_tier 
    FROM travel_requisitions
    WHERE request_id = $1
  `;

  const result = await query(baseQuery, [uuid]);

  // Entered request uuid could not be found in our database
  if (result.length === 0) return <NotFoundRequest />;

  const requestData = result[0];

  // Check if request is already processed
  const approvalStatus = requestData.approval_status;
  const approverName = requestData.approver_name;

  if (approvalStatus !== "pending" && approvalStatus !== "N/A")
    return (
      <AlreadyProcessed processedBy={approverName} status={approvalStatus} />
    );

  // Our current approver
  const currentApprover = approverObject.name;
  const currentApproverEmail = approverObject.email;

  return (
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
        travelBusinessJustification={requestData.travel_business_justification}
        travelMode={requestData.travel_mode}
        travelTransportCost={requestData.travel_transport_cost}
        travelOtherCosts={requestData.travel_other_costs}
        travelPerDiem={requestData.travel_per_diem}
        travelTotalCost={requestData.travel_total_cost}
        travelCostCenter={requestData.travel_cost_center}
        travelWithinBudget={requestData.travel_within_budget}
        travelApprovalTier={requestData.travel_approval_tier}
        requestCreatedAt={requestData.request_created_at}
      />
    </Suspense>
  );
};

export default TravelApprovalWrapper;
