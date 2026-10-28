import type { EmployeeStage } from "@/public/assets";

// The order of an employee requisition's approval stages. Requisitions
// submitted (or amended) since migration 034 run HOD -> Retail Director ->
// HR -> CEO (hr_before_director = TRUE); older ones finish on the original
// HOD -> Retail Director -> CEO -> HR. Every check of "which stage is next",
// "has this stage been reached" and "is it final" goes through here (or the
// SQL twin below), so the two orders can't drift apart. Client-safe.

// Compact stage names for status chips, tables and emails - the Director
// role is "CEO" (EMPLOYEE_STAGE_LABELS in public/assets.ts has the long ones)
export const EMPLOYEE_STAGE_SHORT_LABELS: Record<EmployeeStage, string> = {
  hod: "HOD",
  retail_director: "Retail Director",
  hr: "HR",
  director: "CEO",
};

export interface EmployeeChainStatuses {
  hrBeforeDirector: boolean;
  hod: string;
  // 'N/A' when the department doesn't require a Retail Director
  retailDirector: string;
  director: string;
  hr: string;
}

// The stage columns of an employee_requisitions row, as selected
export interface EmployeeStageColumns {
  hr_before_director: boolean;
  employee_hod_approval_status: string;
  employee_retail_director_approval_status: string;
  employee_director_approval_status: string;
  employee_hr_approval_status: string;
}

export function employeeChainFromRow(
  row: EmployeeStageColumns,
): EmployeeChainStatuses {
  return {
    hrBeforeDirector: row.hr_before_director,
    hod: row.employee_hod_approval_status,
    retailDirector: row.employee_retail_director_approval_status,
    director: row.employee_director_approval_status,
    hr: row.employee_hr_approval_status,
  };
}

export function employeeStageOrder(hrBeforeDirector: boolean): EmployeeStage[] {
  return hrBeforeDirector
    ? ["hod", "retail_director", "hr", "director"]
    : ["hod", "retail_director", "director", "hr"];
}

// The stages a requisition shows, in its order - Retail Director only when
// it applies (stored as 'N/A' otherwise)
export function employeeDisplayStages(
  hrBeforeDirector: boolean,
  retailDirectorStatus: string | null | undefined,
): EmployeeStage[] {
  return employeeStageOrder(hrBeforeDirector).filter(
    (stage) =>
      stage !== "retail_director" ||
      (!!retailDirectorStatus && retailDirectorStatus !== "N/A"),
  );
}

// The stage whose approval completes the requisition
export function employeeFinalStage(hrBeforeDirector: boolean): EmployeeStage {
  return hrBeforeDirector ? "director" : "hr";
}

function stageStatus(chain: EmployeeChainStatuses, stage: EmployeeStage) {
  switch (stage) {
    case "hod":
      return chain.hod;
    case "retail_director":
      return chain.retailDirector;
    case "director":
      return chain.director;
    case "hr":
      return chain.hr;
  }
}

const isDone = (status: string) => status === "approved" || status === "N/A";

// Every stage before `stage` is approved (or doesn't apply)
export function hasReachedEmployeeStage(
  chain: EmployeeChainStatuses,
  stage: EmployeeStage,
): boolean {
  const order = employeeStageOrder(chain.hrBeforeDirector);
  return order
    .slice(0, order.indexOf(stage))
    .every((earlier) => isDone(stageStatus(chain, earlier)));
}

// The stage now waiting on someone, or null once the requisition is fully
// approved or has been declined
export function currentEmployeeStage(
  chain: EmployeeChainStatuses,
): EmployeeStage | null {
  for (const stage of employeeStageOrder(chain.hrBeforeDirector)) {
    const status = stageStatus(chain, stage);
    if (status === "pending") return stage;
    if (!isDone(status)) return null;
  }
  return null;
}

// Why the submitter can't amend this requisition, or null when they can:
// until the final stage approves - a decline at any stage is still
// amendable - and never for one imported from before the app (migration
// 036), which an amendment would reopen in the live approval chain.
// `imported` is employee_requisitions.imported_at IS NOT NULL.
export function employeeNotAmendableReason(
  chain: EmployeeChainStatuses,
  imported: boolean,
): string | null {
  if (imported) {
    return "This requisition was imported from before the Apps Hub and can't be amended - please submit a new requisition instead";
  }
  const finalStatus = stageStatus(
    chain,
    employeeFinalStage(chain.hrBeforeDirector),
  );
  return finalStatus === "pending" || finalStatus === "declined"
    ? null
    : "This requisition can no longer be amended - it has already been fully approved";
}

export function isEmployeeAmendable(
  chain: EmployeeChainStatuses,
  imported: boolean,
): boolean {
  return employeeNotAmendableReason(chain, imported) === null;
}

// SQL twin of hasReachedEmployeeStage for a row of employee_requisitions
// aliased `alias` - used by the dashboard queues/history and the approver
// pending-work checks.
export function employeeStageReachedSql(
  alias: string,
  stage: Exclude<EmployeeStage, "hod">,
): string {
  const hodDone = `${alias}.employee_hod_approval_status = 'approved'`;
  if (stage === "retail_director") return hodDone;

  const retailDirectorDone = `${alias}.employee_retail_director_approval_status IN ('approved', 'N/A')`;
  const otherStageApproved =
    stage === "hr"
      ? `(${alias}.hr_before_director OR ${alias}.employee_director_approval_status = 'approved')`
      : `(NOT ${alias}.hr_before_director OR ${alias}.employee_hr_approval_status = 'approved')`;

  return `${hodDone} AND ${retailDirectorDone} AND ${otherStageApproved}`;
}
