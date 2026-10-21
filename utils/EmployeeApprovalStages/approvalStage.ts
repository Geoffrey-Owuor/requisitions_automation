import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import {
  loadDirectorArray,
  loadHrArray,
  loadRetailDirectorArray,
} from "@/lib/loadApprovers";
import { EmployeeStage } from "@/public/assets";
import {
  EMPLOYEE_STAGE_SHORT_LABELS as STAGE_LABELS,
  EmployeeChainStatuses,
  currentEmployeeStage,
  employeeStageOrder,
} from "@/lib/employeeApprovalOrder";

type ArrayStage = Exclude<EmployeeStage, "hod">;

// How each array stage is named in emails - the Director role is "CEO"
const STAGE_NAMES: Record<ArrayStage, { role: string; forwardedTo: string }> = {
  retail_director: {
    role: "Retail Director",
    forwardedTo: "the Retail Director",
  },
  director: { role: "CEO", forwardedTo: "the CEO" },
  hr: { role: "HR", forwardedTo: "HR" },
};

// The role an approver also holds that auto-approved a later stage
const AUTO_APPROVER_ROLES: Partial<Record<EmployeeStage, string>> = {
  retail_director: "a Retail Director",
  director: "a Director/CEO",
};

export function stageForwardedTo(stage: ArrayStage) {
  return STAGE_NAMES[stage].forwardedTo;
}

/**
 * Emails every approver of an array stage the requisition has just reached
 * (any of them can act, first click wins).
 */
export async function notifyStageApprovers(
  stage: ArrayStage,
  requestId: string,
  message: string,
  title: string,
) {
  const approvers =
    stage === "retail_director"
      ? await loadRetailDirectorArray()
      : stage === "director"
        ? await loadDirectorArray()
        : await loadHrArray("employee");

  approvers.forEach((approver) => {
    EmployeeEmailSender({
      to: approver.email,
      requestId,
      message,
      title,
      role: STAGE_NAMES[stage].role,
      reviewLink: `?token=${approver.uuid}&stage=${stage}`,
    });
  });
}

type EmployeeApprovalStageProps = {
  uuid: string;
  stage: EmployeeStage;
  status: string;
  approverEmail: string;
  approverName: string;
  userEmail: string;
  // Whoever acted on the HOD stage
  hodEmail: string;
  // The chain once this decision (and any auto-approvals it caused) is saved
  chain: EmployeeChainStatuses;
  // Everyone who has acted on another stage - told about a final decision
  otherApproverEmails: (string | null | undefined)[];
};

/**
 * Sends the emails for one approver's decision. An approval forwards the
 * requisition to the next pending stage in its order (lib/employeeApprovalOrder.ts),
 * telling the approver, the HOD and the submitter. An approval with no
 * stage left, or a decline, is final: everyone who acted on the requisition
 * hears about it.
 */
export async function employeeApprovalStage({
  uuid,
  stage,
  status,
  approverEmail,
  approverName,
  userEmail,
  hodEmail,
  chain,
  otherApproverEmails,
}: EmployeeApprovalStageProps) {
  const nextStage = status === "approved" ? currentEmployeeStage(chain) : null;
  const isFinal = nextStage === null;

  // Stages between this one and the next that are already approved were
  // auto-approved because the HOD also holds that role
  const order = employeeStageOrder(chain.hrBeforeDirector);
  const skipped = order
    .slice(
      order.indexOf(stage) + 1,
      nextStage ? order.indexOf(nextStage) : order.length,
    )
    .filter((later) => AUTO_APPROVER_ROLES[later])
    .filter((later) =>
      later === "director"
        ? chain.director === "approved"
        : chain.retailDirector === "approved",
    );
  const autoNote = skipped
    .map(
      (later) =>
        ` As ${stage === "hod" ? "you are" : "the HOD is"} also ${AUTO_APPROVER_ROLES[later]}, the ${STAGE_LABELS[later]} approval stage was automatically approved.`,
    )
    .join("");

  // Final decisions go to everyone involved, others to the HOD only. The
  // approver and submitter get their own wording.
  const others = [
    ...new Set(
      (isFinal ? [hodEmail, ...otherApproverEmails] : [hodEmail]).filter(
        (email): email is string =>
          !!email && email !== approverEmail && email !== userEmail,
      ),
    ),
  ];
  const notifySubmitter = userEmail !== approverEmail;

  if (status === "declined") {
    const declinedIn = `declined in the ${STAGE_LABELS[stage]} approval stage`;
    const title = `Final Update: Employee Requisition Declined By ${approverName}`;

    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this employee requisition.",
      title: "Final Update: Employee Requisition Declined",
      role: "user",
    });
    if (others.length > 0) {
      EmployeeEmailSender({
        to: others.length > 1 ? others : others[0],
        requestId: uuid,
        message: `This employee requisition has been ${declinedIn}`,
        title,
        role: "user",
      });
    }
    if (notifySubmitter) {
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been ${declinedIn}`,
        title,
        role: "user",
      });
    }
    return;
  }

  if (status !== "approved") return;

  if (nextStage === null) {
    const title = `Final Update: Employee Requisition Approved By ${approverName}`;

    EmployeeEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: `You have approved this employee requisition.${autoNote}`,
      title: "Final Update: Employee Requisition Approved",
      role: "user",
      showViewLink: true,
    });
    if (others.length > 0) {
      EmployeeEmailSender({
        to: others.length > 1 ? others : others[0],
        requestId: uuid,
        message: `This employee requisition has been approved by ${approverName}`,
        title,
        role: "user",
        showViewLink: true,
      });
    }
    if (notifySubmitter) {
      EmployeeEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your employee requisition has been approved by ${approverName}`,
        title,
        role: "user",
        showViewLink: true,
      });
    }
    return;
  }

  // The HOD stage is always first, so it's never the next one
  const forwardedTo = stageForwardedTo(nextStage as ArrayStage);
  const title = `Update: Employee Requisition Approved By ${approverName}`;

  await notifyStageApprovers(
    nextStage as ArrayStage,
    uuid,
    "A new employee requisition has been submitted and requires your approval",
    "Action Required: New Employee Requisition",
  );

  EmployeeEmailSender({
    to: approverEmail,
    requestId: uuid,
    message: `You have approved this employee requisition.${autoNote} It has been forwarded to ${forwardedTo} for the next approval stage`,
    title: "Update: Employee Requisition Approved",
    role: "user",
  });
  others.forEach((email) => {
    EmployeeEmailSender({
      to: email,
      requestId: uuid,
      message: `This employee requisition has been approved by ${approverName} and has been forwarded to ${forwardedTo} for the next approval stage`,
      title,
      role: "user",
    });
  });
  if (notifySubmitter) {
    EmployeeEmailSender({
      to: userEmail,
      requestId: uuid,
      message: `Your employee requisition has been approved by ${approverName} and has been forwarded to ${forwardedTo} for the next approval stage`,
      title,
      role: "user",
    });
  }
}
