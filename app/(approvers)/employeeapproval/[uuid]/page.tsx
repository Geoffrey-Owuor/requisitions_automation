import { Metadata } from "next";
import { Suspense } from "react";
import ApproverShell from "@/components/Approvers/ApproverShell";
import { query } from "@/lib/db";
import EmployeeApprovalModal from "@/components/Approvers/EmployeeApprovers/EmployeeApprovalModal";
import { PreviousApproval } from "@/components/Approvers/PreviousApprovalsSection";
import TravelApprovalSkeleton from "@/components/Skeletons/TravelApprovalSkeleton";
import AlreadyProcessed from "@/components/Approvers/TravelApprovers/AlreadyProcessed";
import InvalidToken from "@/components/Approvers/TravelApprovers/InvalidToken";
import NotFoundRequest from "@/components/Approvers/TravelApprovers/NotFoundRequest";
import NotAssignedHod from "@/components/Approvers/NotAssignedHod";
import { getHodPageAccess } from "@/lib/hodAssignment";
import {
  employeeAmendmentsQuery,
  EmployeeAmendmentValues,
} from "@/lib/employeeAmendment";
import {
  isValidEmployeeStage,
  RETAIL_DEPARTMENT,
  EMPLOYEE_STAGE_LABELS,
} from "@/public/assets";

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

const ApprovalPageContent = async ({
  params,
  searchParams,
}: ApprovalPageProps) => {
  const { uuid } = await params;
  const { token, stage } = await searchParams;

  // First fallback - one of our props is missing/falsy
  if (!uuid || !token || !isValidEmployeeStage(stage))
    return <NotFoundRequest />;

  // HR approvers are additionally scoped to the forms in their hr_forms
  // allow-list - an approver not permitted for this form is treated the
  // same as an invalid token, so their permissions aren't leaked.
  const validApprover = await query(
    stage === "hr"
      ? `SELECT hr_email AS email, hr_name AS name, hr_forms
         FROM hr_array WHERE hr_uuid = $1`
      : `SELECT ${stage}_email AS email,
       ${stage}_name AS name
       FROM ${stage}_array WHERE ${stage}_uuid = $1`,
    [token],
  );

  if (validApprover.length === 0) return <InvalidToken />;

  if (stage === "hr" && !validApprover[0].hr_forms.includes("employee")) {
    return <InvalidToken />;
  }

  const approverDetails = validApprover[0];

  // HOD stage: only the assigned HOD or one of their alternates may review
  // this requisition - checked before any of its details are loaded.
  if (stage === "hod") {
    const hodAccess = await getHodPageAccess(
      "employee_requisitions",
      "employee_hod_email",
      uuid,
      approverDetails.email,
    );
    if (hodAccess.status === "not_found") return <NotFoundRequest />;
    if (hodAccess.status === "denied")
      return <NotAssignedHod message={hodAccess.message} />;
  }

  // Token is valid - lets query the database for the employee requisition data
  const baseQuery = `
      SELECT
        employee_${stage}_approval_status AS approval_status,
        employee_${stage}_approver AS approver_name,
        request_created_at, submitter_name, submitter_email, employee_department,
        employee_hod_approver, employee_hod_approval_status, employee_hod_comments,
        employee_retail_director_approver, employee_retail_director_approval_status,
        employee_retail_director_comments,
        employee_director_approver, employee_director_approval_status,
        employee_director_comments, amendment_count
        FROM employee_requisitions
        WHERE request_id = $1
      `;

  const result = await query(baseQuery, [uuid]);

  // Entered request uuid could not be found in our database
  if (result.length === 0) return <NotFoundRequest />;

  const requestData = result[0];

  // Retail Director is only part of the chain for Retail-department
  // requisitions
  if (
    stage === "retail_director" &&
    requestData.employee_department !== RETAIL_DEPARTMENT
  )
    return <NotFoundRequest />;

  const isRetailRequisition =
    requestData.employee_department === RETAIL_DEPARTMENT;

  // Build the list of stages that precede the current one. Retail Director
  // only ever sits between HOD and CEO, and only for Retail-department
  // requisitions.
  const previousApprovals: PreviousApproval[] = [];
  if (stage !== "hod") {
    previousApprovals.push({
      label: EMPLOYEE_STAGE_LABELS.hod,
      approverName: requestData.employee_hod_approver,
      status: requestData.employee_hod_approval_status,
      comments: requestData.employee_hod_comments,
    });
  }
  if (isRetailRequisition && (stage === "director" || stage === "hr")) {
    previousApprovals.push({
      label: EMPLOYEE_STAGE_LABELS.retail_director,
      approverName: requestData.employee_retail_director_approver,
      status: requestData.employee_retail_director_approval_status,
      comments: requestData.employee_retail_director_comments,
    });
  }
  if (stage === "hr") {
    previousApprovals.push({
      label: EMPLOYEE_STAGE_LABELS.director,
      approverName: requestData.employee_director_approver,
      status: requestData.employee_director_approval_status,
      comments: requestData.employee_director_comments,
    });
  }

  const positionsResult = await query(
    `
      SELECT
        position_id, position_title, number_required,
        position_justification, position_reporting_to, date_position_filled,
        position_replacement_or_new, position_job_grade, position_salary_range
        FROM employee_requisition_positions
        WHERE request_id = $1
        ORDER BY position_created_at, position_id
      `,
    [uuid],
  );

  const attachmentsResult = await query(
    `
      SELECT attachment_id, position_id, original_filename, attachment_type
        FROM employee_requisition_attachments
        WHERE request_id = $1
        ORDER BY position_id, attachment_type
      `,
    [uuid],
  );

  const amendments = await query<EmployeeAmendmentValues>(
    employeeAmendmentsQuery,
    [uuid],
  );

  // Check if request is already processed
  const approvalStatus = requestData.approval_status;
  const approverName = requestData.approver_name;

  if (approvalStatus !== "pending" && approvalStatus !== "N/A")
    return (
      <AlreadyProcessed processedBy={approverName} status={approvalStatus} />
    );

  // Our current approver
  const currentApprover = approverDetails.name;

  return (
    <Suspense fallback={<TravelApprovalSkeleton />}>
      <EmployeeApprovalModal
        uuid={uuid}
        stage={stage}
        token={token}
        approverName={currentApprover}
        submitterName={requestData.submitter_name}
        submitterEmail={requestData.submitter_email}
        department={requestData.employee_department}
        requestCreatedAt={requestData.request_created_at}
        previousApprovals={previousApprovals}
        amendmentCount={requestData.amendment_count}
        amendments={amendments}
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
              (attachment) => attachment.position_id === position.position_id,
            )
            .map((attachment) => ({
              attachmentId: attachment.attachment_id,
              originalFilename: attachment.original_filename,
              attachmentType: attachment.attachment_type,
            })),
        }))}
      />
    </Suspense>
  );
};

// Every outcome - the approval modal and each status screen - renders inside
// the session-chosen shell.
const page = (props: ApprovalPageProps) => (
  <ApproverShell>
    <ApprovalPageContent {...props} />
  </ApproverShell>
);

export default page;
