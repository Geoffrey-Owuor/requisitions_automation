import {
  CircleDollarSign,
  CircleQuestionMark,
  HousePlug,
  LaptopMinimalCheck,
  LucideIcon,
  ShoppingBag,
} from "lucide-react";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import { getRequisitionType, newRequisitionHref } from "@/lib/dashboardTables";
import { REPORTS_PAGE, canViewReports } from "@/lib/reports/definitions";
import { SETTINGS_PAGE, canManageSettings } from "@/lib/configAdmin";

// The dashboard navigation shared by the desktop rail (DashboardSidebar) and
// the mobile drawer (MobileHeader), so the two can't drift apart.

export type DashboardNavItem = {
  key: string;
  href: string;
  label: string;
  // Fits the 64px desktop rail; the tooltip shows the full label
  shortLabel: string;
  Icon: LucideIcon;
  // Path prefix the item is active under (defaults to href)
  activePath?: string;
  // Opens in a new tab, outside the dashboard
  external?: boolean;
  // Extra words the app menu's search matches (lowercase)
  keywords?: string[];
};

export type DashboardNavGroup = {
  key: string;
  label: string;
  items: DashboardNavItem[];
};

export const HOME_NAV_ITEM: DashboardNavItem = {
  key: "home",
  href: "/dashboard",
  label: "Home",
  shortLabel: "Home",
  Icon: HousePlug,
  keywords: ["dashboard", "start", "overview"],
};

export const GUIDELINES_NAV_ITEM: DashboardNavItem = {
  key: "guidelines",
  href: "/guidelines/travel",
  label: "Guidelines",
  shortLabel: "Guides",
  Icon: CircleQuestionMark,
  external: true,
  keywords: ["help", "policy", "guide", "how to"],
};

// A requisition is active on its whole type area: the tables, the new form
// and the amend pages
const requisitionItem = (
  type: DashboardRequisitionType,
  label: string,
  shortLabel: string,
  keywords: string[],
): DashboardNavItem => {
  const { href, Icon } = getRequisitionType(type);
  return {
    key: type,
    href: newRequisitionHref(type),
    label,
    shortLabel,
    Icon,
    activePath: href,
    keywords,
  };
};

export function getDashboardNavGroups(roles: string[]): DashboardNavGroup[] {
  const groups: DashboardNavGroup[] = [
    {
      key: "requisitions",
      label: "Requisitions",
      items: [
        requisitionItem("it", "IT Requisition", "IT", [
          "laptop",
          "computer",
          "hardware",
          "software",
          "equipment",
          "phone",
        ]),
        requisitionItem("travel", "Travel Requisition", "Travel", [
          "trip",
          "flight",
          "hotel",
          "per diem",
          "transport",
        ]),
        requisitionItem("casual", "Casual Requisition", "Casual", [
          "labour",
          "labor",
          "workers",
          "temporary",
          "casuals",
        ]),
        requisitionItem("employee", "Employee Requisition", "Employee", [
          "hiring",
          "recruit",
          "new hire",
          "position",
          "vacancy",
        ]),
        requisitionItem("access", "Key & Access", "Access", [
          "keys",
          "door",
          "card",
          "building",
          "security",
        ]),
      ],
    },
    {
      key: "services",
      label: "Services",
      items: [
        {
          key: "advance",
          href: "/dashboard/advance",
          label: "Salary Advance",
          shortLabel: "Advance",
          Icon: CircleDollarSign,
          keywords: ["salary", "money", "loan", "cash", "pay"],
        },
        {
          key: "staffpurchase",
          href: "/dashboard/staffproductpurchase",
          label: "Staff Purchase",
          shortLabel: "Purchase",
          Icon: ShoppingBag,
          keywords: ["shop", "buy", "product", "discount"],
        },
        {
          key: "helpdesk",
          href: "/dashboard/helpdesk",
          label: "HelpDesk",
          shortLabel: "Helpdesk",
          Icon: LaptopMinimalCheck,
          keywords: ["support", "ticket", "issue", "problem"],
        },
      ],
    },
  ];

  // Report role and config-admin holders only
  const adminItems: DashboardNavItem[] = [];
  if (canViewReports(roles)) {
    adminItems.push({
      key: "reports",
      href: REPORTS_PAGE.href,
      label: REPORTS_PAGE.label,
      shortLabel: REPORTS_PAGE.label,
      Icon: REPORTS_PAGE.Icon,
      keywords: ["excel", "export", "audit", "download"],
    });
  }
  if (canManageSettings(roles)) {
    adminItems.push({
      key: "settings",
      href: SETTINGS_PAGE.href,
      label: SETTINGS_PAGE.label,
      shortLabel: SETTINGS_PAGE.label,
      Icon: SETTINGS_PAGE.Icon,
      keywords: ["config", "configuration", "rates", "locations", "casual"],
    });
  }
  if (adminItems.length > 0) {
    groups.push({ key: "admin", label: "Admin", items: adminItems });
  }

  return groups;
}

export function isNavItemActive(item: DashboardNavItem, pathname: string) {
  if (item.external) return false;
  const base = item.activePath ?? item.href;
  // Home only on itself, or it would match every dashboard page
  if (base === HOME_NAV_ITEM.href) return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}
