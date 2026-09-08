import {
  BriefcaseBusiness,
  HardHat,
  LockKeyhole,
  Monitor,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Ordered registry of every table UserDashboard can render, in DOM order.
 *
 * `key` matches the tableKey each *RequisitionsTable component passes to
 * RequisitionTable (`${type}-${dataFlag}`) — the same string used for
 * tableStatus/visibleTableKeys in UserDashboard and for collapse state in
 * useTableCollapseStore. `label` is a short chip label distinct from each
 * table's own (much longer) title.
 */
export type DashboardTableEntry = {
  key: string;
  label: string;
  Icon: LucideIcon;
};

export const DASHBOARD_TABLES: DashboardTableEntry[] = [
  { key: "travel-userData", label: "Travel · Yours", Icon: BriefcaseBusiness },
  { key: "travel-hodPending", label: "Travel · HOD", Icon: BriefcaseBusiness },
  { key: "travel-hrPending", label: "Travel · HR", Icon: BriefcaseBusiness },
  {
    key: "travel-directorPending",
    label: "Travel · Director",
    Icon: BriefcaseBusiness,
  },
  { key: "it-userData", label: "IT · Yours", Icon: Monitor },
  { key: "it-hodPending", label: "IT · HOD", Icon: Monitor },
  { key: "it-itPending", label: "IT · Fulfilment", Icon: Monitor },
  { key: "it-itAll", label: "IT · All", Icon: Monitor },
  { key: "access-userData", label: "Access · Yours", Icon: LockKeyhole },
  { key: "access-hodPending", label: "Access · HOD", Icon: LockKeyhole },
  {
    key: "access-securityPending",
    label: "Access · Security",
    Icon: LockKeyhole,
  },
  { key: "casual-userData", label: "Casual · Yours", Icon: HardHat },
  { key: "casual-hodPending", label: "Casual · HOD", Icon: HardHat },
  { key: "casual-hrPending", label: "Casual · HR", Icon: HardHat },
  {
    key: "employee-userData",
    label: "Employee · Yours",
    Icon: UserRoundPlus,
  },
  {
    key: "employee-hodPending",
    label: "Employee · HOD",
    Icon: UserRoundPlus,
  },
  {
    key: "employee-retailDirectorPending",
    label: "Employee · Retail Director",
    Icon: UserRoundPlus,
  },
  {
    key: "employee-directorPending",
    label: "Employee · CEO",
    Icon: UserRoundPlus,
  },
  { key: "employee-hrPending", label: "Employee · HR", Icon: UserRoundPlus },
];
