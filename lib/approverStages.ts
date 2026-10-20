import { ALLOWED_HR_FORMS, type HrForm } from "@/public/assets";

// Client-safe: the approver arrays the Settings page's Approvers tab manages.
// `key` is the {key}_array table and its {key}_uuid/_name/_email columns, so
// the server only ever interpolates a key from this list.

export const APPROVER_STAGES = [
  {
    key: "hod",
    label: "HOD",
    description:
      "Heads of department. Each requisition goes to the one HOD chosen at submission (auto-selected from their department) and that HOD's alternates.",
  },
  {
    key: "hr",
    label: "HR",
    description:
      "Any member may act on the forms they're allowed (first click wins). Their dashboard queue and emails follow the same forms.",
  },
  {
    key: "director",
    label: "Director / CEO",
    description:
      "Tier 3 travel and every employee requisition. Any member may act (first click wins). Labelled CEO on employee requisitions.",
  },
  {
    key: "retail_director",
    label: "Retail Director",
    description:
      "Employee requisitions from departments flagged as needing a Retail Director. Any member may act (first click wins).",
  },
  {
    key: "it",
    label: "IT",
    description:
      "IT requisitions after the HOD. Members also see every IT requisition and can export them all.",
  },
  {
    key: "security",
    label: "Security",
    description:
      "Key & access requisitions after the HOD. Any member may act (first click wins).",
  },
  {
    key: "finance",
    label: "Finance",
    description:
      "Not used by any approval flow at the moment; kept for Finance notifications.",
  },
] as const;

export type ApproverStageKey = (typeof APPROVER_STAGES)[number]["key"];

export const isApproverStageKey = (value: unknown): value is ApproverStageKey =>
  APPROVER_STAGES.some((stage) => stage.key === value);

export const HR_FORM_LABELS: Record<HrForm, string> = {
  casual: "Casual",
  employee: "Employee",
  travel: "Travel",
};

export const isHrFormList = (value: unknown): value is HrForm[] =>
  Array.isArray(value) &&
  value.every((form) => (ALLOWED_HR_FORMS as readonly string[]).includes(form));
