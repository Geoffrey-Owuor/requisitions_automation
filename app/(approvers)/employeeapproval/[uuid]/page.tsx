import { Metadata } from "next";
import { Suspense } from "react";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import { UserProvider } from "@/context/UserContext";
import { query } from "@/lib/db";
import EmployeeApprovalModal from "@/components/Approvers/EmployeeApprovers/EmployeeApprovalModal";
import TravelApprovalSkeleton from "@/components/Skeletons/TravelApprovalSkeleton";
import AlreadyProcessed from "@/components/Approvers/TravelApprovers/AlreadyProcessed";
import InvalidToken from "@/components/Approvers/TravelApprovers/InvalidToken";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import { isValidEmployeeStage } from "@/public/assets";

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
  if (!isValidEmployeeStage(stage)) {
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
  if (!uuid || !token || !isValidEmployeeStage(stage))
    return <NotFoundRequest />;

  const validApprover = await query(
    `SELECT ${stage}_email AS email,
       ${stage}_name AS name
       FROM ${stage}_array WHERE ${stage}_uuid = $1`,
    [token],
  );

  if (validApprover.length === 0) return <InvalidToken />;

  const approverDetails = validApprover[0];

  // Token is valid - lets query the database for the employee requisition data
  const baseQuery = `
      SELECT
        employee_${stage}_approval_status AS approval_status,
        employee_${stage}_approver AS approver_name,
        request_created_at, submitter_name, submitter_email, employee_department
        FROM employee_requisitions
        WHERE request_id = $1
      `;

  const result = await query(baseQuery, [uuid]);

  // Entered request uuid could not be found in our database
  if (result.length === 0) return <NotFoundRequest />;

  const requestData = result[0];

  const positionsResult = await query(
    `
      SELECT
        position_id, position_title, number_required,
        position_justification, position_reporting_to, date_position_filled,
        position_replacement_or_new, position_job_grade, position_salary_range
        FROM employee_requisition_positions
        WHERE request_id = $1
        ORDER BY position_created_at
      `,
    [uuid],
  );

  const attachmentsResult = await query(
    `
      SELECT attachment_id, position_id, original_filename
        FROM employee_requisition_attachments
        WHERE request_id = $1
        ORDER BY position_id, upload_index
      `,
    [uuid],
  );

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
            <EmployeeApprovalModal
              uuid={uuid}
              stage={stage}
              token={token}
              approverName={currentApprover}
              approverEmail={currentApproverEmail}
              submitterName={requestData.submitter_name}
              submitterEmail={requestData.submitter_email}
              department={requestData.employee_department}
              requestCreatedAt={requestData.request_created_at}
              positions={positionsResult.map((position) => ({
                positionId: position.position_id,
                positionTitle: position.position_title,
                numberRequired: position.number_required,
                replacementOrNew: position.position_replacement_or_new,
                jobGrade: position.position_job_grade,
                salaryRange: position.position_salary_range,
                justification: position.position_justification,
                reportingTo: position.position_reporting_to,
                dateFilled: position.date_position_filled,
                attachments: attachmentsResult
                  .filter(
                    (attachment) =>
                      attachment.position_id === position.position_id,
                  )
                  .map((attachment) => ({
                    attachmentId: attachment.attachment_id,
                    originalFilename: attachment.original_filename,
                  })),
              }))}
            />
          </Suspense>
        </RequisitionPagesWrapper>
      </DashboardWrapper>
    </UserProvider>
  );
};

export default page;
