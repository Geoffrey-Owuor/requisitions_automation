// The columns of the import template's Requisitions sheet, shared by the
// template, the validator and the import. Columns are matched by header
// text, so their order in a filled-in file doesn't matter.

// Approval stages, keyed like EmployeeStage in public/assets.ts. Labels
// follow EMPLOYEE_STAGE_SHORT_LABELS (lib/employeeApprovalOrder.ts).
export const STAGES = [
  { key: "hod", label: "HOD" },
  { key: "retail_director", label: "Retail Director" },
  { key: "hr", label: "HR" },
  { key: "director", label: "CEO" },
];

// The stage order a requisition follows - employeeStageOrder in
// lib/employeeApprovalOrder.ts
export function stageOrder(hrBeforeDirector) {
  return hrBeforeDirector
    ? ["hod", "retail_director", "hr", "director"]
    : ["hod", "retail_director", "director", "hr"];
}

export const stageLabel = (key) => STAGES.find((s) => s.key === key).label;

export const APPROVAL_ORDERS = {
  "HR before CEO": true,
  "CEO before HR": false,
};

export const DECISIONS = ["Approved", "Declined"];
export const RETAIL_DIRECTOR_DECISIONS = ["Approved", "Declined", "N/A"];

// REPLACEMENT_OR_NEW_OPTIONS in public/assets.ts
export const REPLACEMENT_OR_NEW = ["Replacement", "New"];

// level: "requisition" columns describe the whole requisition and may be
// left blank on its second and later position rows; "position" columns
// belong to the row's own position.
const requisitionColumns = [
  {
    key: "legacyRef",
    header: "Legacy Ref",
    required: true,
    width: 16,
    accepts: "Text, up to 100 characters",
    notes:
      "The requisition's reference from the old process. Every row with the same Legacy Ref is one position of the same requisition. Fill it on every row.",
  },
  {
    key: "submittedDate",
    header: "Submitted Date",
    required: true,
    kind: "date",
    width: 15,
    accepts: "A date",
    notes: "When the requisition was submitted. Not in the future.",
  },
  {
    key: "submitterName",
    header: "Submitter Name",
    required: true,
    width: 22,
    accepts: "Text",
  },
  {
    key: "submitterEmail",
    header: "Submitter Email",
    required: true,
    width: 28,
    accepts: "An email address",
    notes:
      "The requisition shows in this person's My Requisitions once they sign in.",
  },
  {
    key: "department",
    header: "Department",
    required: true,
    width: 22,
    accepts: "A department from the Lists sheet",
    notes: "Inactive departments are allowed.",
  },
  {
    key: "approvalOrder",
    header: "Approval Order",
    required: true,
    width: 16,
    accepts: Object.keys(APPROVAL_ORDERS).join(" or "),
    notes:
      "The order HR and the CEO approved in. Retail Director (when it applies) always comes after the HOD.",
  },
];

const positionColumns = [
  {
    key: "positionTitle",
    header: "Position Title",
    required: true,
    width: 24,
    accepts: "Text, up to 100 characters",
  },
  {
    key: "numberRequired",
    header: "Number Required",
    required: true,
    kind: "integer",
    width: 12,
    accepts: "A whole number, 1 or more",
  },
  {
    key: "replacementOrNew",
    header: "Replacement/New",
    required: true,
    width: 15,
    accepts: REPLACEMENT_OR_NEW.join(" or "),
  },
  {
    key: "jobGrade",
    header: "Job Grade",
    required: true,
    width: 18,
    accepts: "A job grade from the Lists sheet",
    notes: "Inactive grades are allowed. The grade's current rank is stored.",
  },
  {
    key: "salaryMin",
    header: "Salary Min (KES)",
    required: true,
    kind: "money",
    width: 14,
    accepts: "A number above 0",
  },
  {
    key: "salaryMax",
    header: "Salary Max (KES)",
    required: true,
    kind: "money",
    width: 14,
    accepts: "A number, at least Salary Min",
  },
  {
    key: "justification",
    header: "Justification",
    required: true,
    width: 36,
    accepts: "Text",
  },
  {
    key: "reportingTo",
    header: "Reporting To",
    required: true,
    width: 20,
    accepts: "Text, up to 100 characters",
  },
  {
    key: "targetFillDate",
    header: "Target Fill Date",
    required: true,
    kind: "date",
    width: 15,
    accepts: "A date",
    notes: "Past dates are allowed.",
  },
];

const stageColumns = STAGES.flatMap(({ key, label }) => [
  {
    key: `${key}.decision`,
    header: `${label} Decision`,
    stage: key,
    field: "decision",
    width: 16,
    accepts:
      key === "retail_director"
        ? RETAIL_DIRECTOR_DECISIONS.join(", ") + " or blank"
        : DECISIONS.join(", ") + " or blank",
    notes:
      key === "hod"
        ? "Always Approved or Declined."
        : key === "retail_director"
          ? "N/A when the department didn't need a Retail Director. Blank only after an earlier decline."
          : "Blank only after an earlier decline.",
  },
  {
    key: `${key}.name`,
    header: `${label} Name`,
    stage: key,
    field: "name",
    width: 20,
    accepts: "Text",
    notes: "Required when the stage was decided, blank otherwise.",
  },
  {
    key: `${key}.email`,
    header: `${label} Email`,
    stage: key,
    field: "email",
    width: 26,
    accepts: "An email address",
    notes: "Required when the stage was decided, blank otherwise.",
  },
  {
    key: `${key}.date`,
    header: `${label} Date`,
    stage: key,
    field: "date",
    kind: "date",
    width: 15,
    accepts: "A date (a time is optional)",
    notes:
      "Required when the stage was decided. Not before the submitted date or an earlier stage's date.",
  },
  {
    key: `${key}.comments`,
    header: `${label} Comments`,
    stage: key,
    field: "comments",
    width: 28,
    accepts: "Text",
    notes: "Optional. Blank when the stage wasn't decided.",
  },
]);

export const COLUMNS = [
  ...requisitionColumns.map((c) => ({ ...c, level: "requisition" })),
  ...positionColumns.map((c) => ({ ...c, level: "position" })),
  ...stageColumns.map((c) => ({ ...c, level: "requisition" })),
];

export const DATA_SHEET = "Requisitions";
export const LISTS_SHEET = "Lists";
