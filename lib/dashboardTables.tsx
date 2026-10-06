import {
  BriefcaseBusiness,
  HardHat,
  LockKeyhole,
  Monitor,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import type { ApproverMemberships } from "@/lib/approverMemberships";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";

// Who is looking — the same roles/memberships the dashboard layout loads
// into UserProvider. The server re-derives these for the summary endpoint,
// and every table loader re-checks its own gate, so this only decides what
// to render (and what to count).
export type DashboardViewer = {
  roles: string[];
  memberships: ApproverMemberships;
};

export type DashboardTab = "mine" | "pending" | "history";

export const DASHBOARD_TABS: { tab: DashboardTab; label: string }[] = [
  { tab: "mine", label: "My Requisitions" },
  { tab: "pending", label: "Pending Approval" },
  { tab: "history", label: "History" },
];

export type RequisitionTypeEntry = {
  type: DashboardRequisitionType;
  label: string;
  // Lowercase noun for sentences: "No travel requisitions are waiting…"
  noun: string;
  href: string;
  Icon: LucideIcon;
};

export const REQUISITION_TYPES: RequisitionTypeEntry[] = [
  {
    type: "travel",
    label: "Travel",
    noun: "travel",
    href: "/dashboard/travel",
    Icon: BriefcaseBusiness,
  },
  {
    type: "it",
    label: "IT",
    noun: "IT",
    href: "/dashboard/it",
    Icon: Monitor,
  },
  {
    type: "access",
    label: "Key & Access",
    noun: "access",
    href: "/dashboard/access",
    Icon: LockKeyhole,
  },
  {
    type: "casual",
    label: "Casual",
    noun: "casual",
    href: "/dashboard/casual",
    Icon: HardHat,
  },
  {
    type: "employee",
    label: "Employee",
    noun: "employee",
    href: "/dashboard/employee",
    Icon: UserRoundPlus,
  },
];

export const getRequisitionType = (type: DashboardRequisitionType) =>
  REQUISITION_TYPES.find((entry) => entry.type === type)!;

/**
 * Every table a requisition type page can render, in display order.
 *
 * `key` is `${type}-${dataFlag}` — the tableKey each *RequisitionsTable
 * passes to RequisitionTable, also used for collapse state in
 * useTableCollapseStore. `stage` is the short label shown in the summary
 * breakdown ("HOD", "HR"). `isVisible` mirrors the server-side gate in that
 * type's loader (serverActions/Get{Type}RequisitionData.ts).
 */
export type DashboardTableEntry = {
  key: string;
  type: DashboardRequisitionType;
  dataFlag: string;
  tab: DashboardTab;
  stage: string;
  isVisible: (viewer: DashboardViewer) => boolean;
  // Overrides the tab's default empty-state body
  emptyBody?: string;
};

const always = () => true;
const isHod = ({ memberships }: DashboardViewer) => memberships.isHodApprover;
const hasRole =
  (role: string) =>
  ({ roles }: DashboardViewer) =>
    roles.includes(role);

function table(
  type: DashboardRequisitionType,
  dataFlag: string,
  tab: DashboardTab,
  stage: string,
  isVisible: (viewer: DashboardViewer) => boolean,
  emptyBody?: string,
): DashboardTableEntry {
  return {
    key: `${type}-${dataFlag}`,
    type,
    dataFlag,
    tab,
    stage,
    isVisible,
    emptyBody,
  };
}

export const DASHBOARD_TABLES: DashboardTableEntry[] = [
  // Travel — HR/Director are role-based ("hr-travel"/"director")
  table("travel", "userData", "mine", "Yours", always),
  table("travel", "hodPending", "pending", "HOD", isHod),
  table("travel", "hrPending", "pending", "HR", hasRole("hr-travel")),
  table(
    "travel",
    "directorPending",
    "pending",
    "Director",
    hasRole("director"),
  ),
  table(
    "travel",
    "history",
    "history",
    "History",
    (v) => isHod(v) || hasRole("hr-travel")(v) || hasRole("director")(v),
  ),

  // IT — IT admins already get the full history (with export) from itAll,
  // so their IT history tab holds that table instead of the HOD history.
  table("it", "userData", "mine", "Yours", always),
  table("it", "hodPending", "pending", "HOD", isHod),
  table("it", "itPending", "pending", "IT", hasRole("it")),
  table(
    "it",
    "itAll",
    "history",
    "All",
    hasRole("it"),
    "No IT requisitions have been submitted yet.",
  ),
  table(
    "it",
    "history",
    "history",
    "History",
    (v) => isHod(v) && !hasRole("it")(v),
  ),

  // Key & Access
  table("access", "userData", "mine", "Yours", always),
  table("access", "hodPending", "pending", "HOD", isHod),
  table(
    "access",
    "securityPending",
    "pending",
    "Security",
    ({ memberships }) => memberships.isSecurityApprover,
  ),
  table(
    "access",
    "history",
    "history",
    "History",
    (v) => isHod(v) || v.memberships.isSecurityApprover,
  ),

  // Casual — HR is array-based and form-scoped (hr_array.hr_forms)
  table("casual", "userData", "mine", "Yours", always),
  table("casual", "hodPending", "pending", "HOD", isHod),
  table("casual", "hrPending", "pending", "HR", ({ memberships }) =>
    memberships.hrForms.includes("casual"),
  ),
  table(
    "casual",
    "history",
    "history",
    "History",
    (v) => isHod(v) || v.memberships.hrForms.includes("casual"),
  ),

  // Employee — Retail Director/Director/HR are array-based; the Director
  // role is labeled "CEO" in the UI
  table("employee", "userData", "mine", "Yours", always),
  table("employee", "hodPending", "pending", "HOD", isHod),
  table(
    "employee",
    "retailDirectorPending",
    "pending",
    "Retail Director",
    ({ memberships }) => memberships.isRetailDirector,
  ),
  table(
    "employee",
    "directorPending",
    "pending",
    "CEO",
    ({ memberships }) => memberships.isDirector,
  ),
  table("employee", "hrPending", "pending", "HR", ({ memberships }) =>
    memberships.hrForms.includes("employee"),
  ),
  table(
    "employee",
    "history",
    "history",
    "History",
    ({ memberships }) =>
      memberships.isHodApprover ||
      memberships.isRetailDirector ||
      memberships.isDirector ||
      memberships.hrForms.includes("employee"),
  ),
];

export const getVisibleTables = (viewer: DashboardViewer) =>
  DASHBOARD_TABLES.filter((entry) => entry.isVisible(viewer));

export const getDashboardTable = (key: string) =>
  DASHBOARD_TABLES.find((entry) => entry.key === key);

// Empty-state copy for a table with no rows at all (not a search miss)
export function tableEmptyCopy(key: string): {
  heading: string;
  body: string;
} {
  const entry = getDashboardTable(key);
  const noun = entry ? getRequisitionType(entry.type).noun : "";
  switch (entry?.tab) {
    case "pending":
      return {
        heading: "You're all caught up",
        body: `No ${noun} requisitions are waiting for your approval.`,
      };
    case "history":
      return {
        heading: "No history yet",
        body:
          entry.emptyBody ??
          `${noun.charAt(0).toUpperCase()}${noun.slice(1)} requisitions you're involved in approving will appear here.`,
      };
    default:
      return {
        heading: "No requisitions yet",
        body: `You haven't submitted any ${noun} requisitions yet.`,
      };
  }
}
