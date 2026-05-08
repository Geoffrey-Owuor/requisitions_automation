import { Suspense } from "react";
import { query } from "@/lib/db";
import { HOD_ARRAY, IT_ARRAY } from "@/secretAssets";
import NotFoundRequest from "../TravelApprovers/NotFoundRequest";
import InvalidToken from "../TravelApprovers/InvalidToken";
import AlreadyProcessed from "../TravelApprovers/AlreadyProcessed";
import ITApprovalSkeleton from "@/components/Skeletons/ITApprovalSkeleton";
import ITApprovalModal, { ITRequisitionData } from "./ITApprovalModal";

type ITApprovalWrapperProps = {
  uuid: string;
  token: string;
  stage: string;
};

const ITApprovalWrapper = async ({
  uuid,
  token,
  stage,
}: ITApprovalWrapperProps) => {
  // First fallback - one of our props is missing/falsy
  if (!uuid || !token || !stage) return <NotFoundRequest />;

  const APPROVERS_ARRAY = stage === "hod" ? HOD_ARRAY : IT_ARRAY;

  const approverObject = APPROVERS_ARRAY.find(
    (approver) => approver.uuid === token,
  );

  if (!approverObject) return <InvalidToken />;

  // Valid approval token - query the database for the IT requisition data
  const baseQuery = `
    SELECT
    request_created_at, submitter_email, submitter_name,
    employee_name, employee_department, employee_staff_number, replacement_new,
    requirements, other_requirements, requisition_date, 
    date_joining, 
    ${stage}_approver_name AS approver_name, 
    ${stage}_approver_status AS approval_status
    FROM it_requisitions WHERE request_id = $1
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

  // Build the single data object passed to the modal
  const modalData: ITRequisitionData = {
    uuid,
    stage,
    approverName: approverObject.name,
    approverEmail: approverObject.email,
    submitterName: requestData.submitter_name,
    submitterEmail: requestData.submitter_email,
    employeeName: requestData.employee_name,
    employeeDepartment: requestData.employee_department,
    employeeStaffNumber: requestData.employee_staff_number,
    replacementNew: requestData.replacement_new,
    requirements: requestData.requirements,
    otherRequirements: requestData.other_requirements ?? "",
    requisitionDate: requestData.requisition_date,
    dateJoining: requestData.date_joining,
    requestCreatedAt: requestData.request_created_at,
  };

  return (
    <Suspense fallback={<ITApprovalSkeleton />}>
      <ITApprovalModal data={modalData} />
    </Suspense>
  );
};

export default ITApprovalWrapper;
