import {
  BriefcaseBusiness,
  CircleDollarSign,
  HardHat,
  LaptopMinimalCheck,
  LockKeyhole,
  Monitor,
  ShoppingBag,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the apps and forms the hub exposes.
 *
 * The homepage directory and the guidelines navigation both read from here, so
 * a new requisition type is added in one place and `slug` is what makes the two
 * agree — it is also the guideline URL segment (`/guidelines/<slug>`).
 */

/** Team that owns the request once it is submitted. */
export type Owner = "HR" | "IT" | "Retail";

/**
 * "form" routes through an approval chain in this app; "portal" is an SSO
 * embed of a separate internal system.
 */
export type AppGroup = "form" | "portal";

export type AppEntry = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  owner: Owner;
  group: AppGroup;
  /** Approvers in order, excluding the submitter. Empty for portals. */
  chain: string[];
  /** Qualifier shown after the chain, e.g. tiering rules. */
  chainNote?: string;
  /** Where the form itself lives, when it is reachable without signing in. */
  action?: { href: string; label: string };
};

/** Ordered as the guidelines navigation lists them. */
export const appDirectory: AppEntry[] = [
  {
    slug: "travel",
    label: "Travel Requisition",
    description:
      "Site visits, local flights, road travel, and international travel with automated multi-tier approvals.",
    icon: BriefcaseBusiness,
    owner: "HR",
    group: "form",
    chain: ["HOD", "HR"],
    chainNote: "Director also approves above KES 100k",
  },
  {
    slug: "it",
    label: "IT Requisition",
    description:
      "Request laptops, peripherals, and software. Routed to your HOD, then fulfilled by the IT team.",
    icon: Monitor,
    owner: "IT",
    group: "form",
    chain: ["HOD", "IT Fulfilment"],
  },
  {
    slug: "casual",
    label: "Casual Requisition",
    description:
      "Request casual staff engagements for a defined period. Routed to your HOD, then HR for approval.",
    icon: HardHat,
    owner: "HR",
    group: "form",
    chain: ["HOD", "HR"],
  },
  {
    slug: "employee",
    label: "Employee Requisition",
    description:
      "Request one or more open positions to be filled. Routed to your HOD, then the CEO, then HR.",
    icon: UserRoundPlus,
    owner: "HR",
    group: "form",
    chain: ["HOD", "CEO", "HR"],
  },
  {
    slug: "access",
    label: "Key(s) & Access Code Issuance",
    description:
      "Request keys and access codes. Routed to your designated HOD, then completed by security.",
    icon: LockKeyhole,
    owner: "Retail",
    group: "form",
    chain: ["HOD", "Security"],
  },
  {
    slug: "advance",
    label: "Salary Advance",
    description:
      "Apply for a salary advance. Requests can be submitted at any time and are picked up in the next monthly processing run.",
    icon: CircleDollarSign,
    owner: "HR",
    group: "form",
    chain: ["HR", "Finance"],
    action: { href: "/advance", label: "Open form" },
  },
  {
    slug: "desk",
    label: "HelpDesk",
    description:
      "Submit an IT issue or ticket through the internal IT HelpDesk platform and track it to resolution.",
    icon: LaptopMinimalCheck,
    owner: "IT",
    group: "portal",
    chain: [],
  },
  {
    slug: "purchase",
    label: "Staff Product Purchase",
    description:
      "The purchase portal for making purchase requisitions at discounted staff prices.",
    icon: ShoppingBag,
    owner: "HR",
    group: "portal",
    chain: ["Payroll", "HR", "Credit Control", "Invoicing"],
  },
];

export const appsByGroup = (group: AppGroup) =>
  appDirectory.filter((entry) => entry.group === group);

export const findApp = (slug: string) =>
  appDirectory.find((entry) => entry.slug === slug);
