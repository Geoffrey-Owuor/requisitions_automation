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
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import {
  ScrollingNav,
  StickyNavBar,
} from "@/components/Dashboard/StickyNavBar";
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
    <RequisitionPagesWrapper
      header={
        <>
          <div className="mx-auto w-full max-w-7xl px-2 pt-4 pb-3">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
              <SETTINGS_PAGE.Icon className="h-5 w-5 text-neutral-500" />
              Settings
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage who can do what and the options the requisition forms use.
              Every change is recorded with your name.
            </p>
          </div>

          {/* One row, each group's tabs after its label */}
          <StickyNavBar>
            <ScrollingNav
              label="Settings sections"
              activeKey={activeTab.key}
              keepContentInView
            >
              {TAB_GROUPS.map((group, index) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={group.label}
                  className={`flex shrink-0 items-center gap-1 ${
                    index > 0 ? "ml-3 border-l border-neutral-200 pl-3" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="mr-1 text-[10px] font-bold tracking-widest whitespace-nowrap text-neutral-400 uppercase"
                  >
                    {group.label}
                  </span>
                  {group.tabs.map(({ key, label, Icon }) => {
                    const isActive = key === activeTab.key;
                    return (
                      <Link
                        key={key}
                        href={`${SETTINGS_PAGE.href}?tab=${key}`}
                        scroll={false}
                        aria-current={isActive ? "page" : undefined}
                        className={`rounded-compact inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </ScrollingNav>
          </StickyNavBar>
        </>
      }
    >
      <div className="px-2 pt-5 pb-6">
        <activeTab.Panel />
      </div>
    </RequisitionPagesWrapper>
  );
}
