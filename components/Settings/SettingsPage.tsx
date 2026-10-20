import Link from "next/link";
import { type ComponentType } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  HandCoins,
  PiggyBank,
  HardHat,
  History,
  Monitor,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { SETTINGS_PAGE } from "@/lib/configAdmin";
import ApproversSettings from "./ApproversSettings";
import AdvanceSettings from "./AdvanceSettings";
import AuditLogSettings from "./AuditLogSettings";
import CasualBudgetsSettings from "./CasualBudgetsSettings";
import CasualSettings from "./CasualSettings";
import DepartmentsSettings from "./DepartmentsSettings";
import EmployeeSettings from "./EmployeeSettings";
import ItSettings from "./ItSettings";
import TravelSettings from "./TravelSettings";
import UsersSettings from "./UsersSettings";

type SettingsTab = {
  key: string;
  label: string;
  Icon: LucideIcon;
  Panel: ComponentType;
};

// One tab per area whose configuration is managed here, grouped, and kept
// in the URL (?tab=) so a tab can be linked to and survives a reload.
const TAB_GROUPS: { label: string; tabs: SettingsTab[] }[] = [
  {
    label: "Access",
    tabs: [
      {
        key: "users",
        label: "Users & roles",
        Icon: UsersRound,
        Panel: UsersSettings,
      },
      {
        key: "approvers",
        label: "Approvers",
        Icon: BadgeCheck,
        Panel: ApproversSettings,
      },
    ],
  },
  {
    label: "Requisitions",
    tabs: [
      {
        key: "departments",
        label: "Departments",
        Icon: Building2,
        Panel: DepartmentsSettings,
      },
      {
        key: "travel",
        label: "Travel",
        Icon: BriefcaseBusiness,
        Panel: TravelSettings,
      },
      { key: "casual", label: "Casual", Icon: HardHat, Panel: CasualSettings },
      {
        key: "casual-budgets",
        label: "Casual budgets",
        Icon: PiggyBank,
        Panel: CasualBudgetsSettings,
      },
      { key: "it", label: "IT", Icon: Monitor, Panel: ItSettings },
      {
        key: "employee",
        label: "Employee",
        Icon: UserRoundPlus,
        Panel: EmployeeSettings,
      },
    ],
  },
  {
    label: "Salary advance",
    tabs: [
      {
        key: "advance",
        label: "Salary advance",
        Icon: HandCoins,
        Panel: AdvanceSettings,
      },
    ],
  },
  {
    label: "Audit",
    tabs: [
      {
        key: "audit",
        label: "Audit log",
        Icon: History,
        Panel: AuditLogSettings,
      },
    ],
  },
];

const TABS = TAB_GROUPS.flatMap((group) => group.tabs);

export default function SettingsPage({ tab }: { tab?: string }) {
  // An unknown or missing tab falls back to the first
  const activeTab = TABS.find((entry) => entry.key === tab) ?? TABS[0];

  return (
    <div className="space-y-5 px-2 pt-4 pb-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <SETTINGS_PAGE.Icon className="h-5 w-5 text-neutral-500" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage who can do what and the options the requisition forms use.
          Every change is recorded with your name.
        </p>
      </div>

      {/* Each group wraps as a unit, under its own label */}
      <nav
        aria-label="Settings sections"
        className="flex flex-wrap items-end gap-x-5 gap-y-3"
      >
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.tabs.map(({ key, label, Icon }) => {
                const isActive = key === activeTab.key;
                return (
                  <Link
                    key={key}
                    href={`${SETTINGS_PAGE.href}?tab=${key}`}
                    scroll={false}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-compact inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <activeTab.Panel />
    </div>
  );
}
