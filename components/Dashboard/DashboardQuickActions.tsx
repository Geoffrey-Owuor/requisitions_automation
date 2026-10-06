"use client";

import Link from "next/link";
import {
  Monitor,
  BriefcaseBusiness,
  LockKeyhole,
  ShoppingBag,
  LaptopMinimalCheck,
  CircleDollarSign,
  ArrowRight,
  LucideIcon,
  HardHat,
  UserRoundPlus,
} from "lucide-react";
import { useToggleStore } from "@/store/useToggleStore";

type QuickAction = {
  label: string;
  description: string;
  Icon: LucideIcon;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

// Shortcuts to every requisition form and portal, shown on the dashboard home.
const DashboardQuickActions = () => {
  // Zustand store — same modal toggles used by DashboardSidebar
  const setShowITRequisition = useToggleStore(
    (state) => state.setShowITRequisition,
  );
  const setShowTravelRequisition = useToggleStore(
    (state) => state.setShowTravelRequisition,
  );
  const setShowAccessRequisition = useToggleStore(
    (state) => state.setShowAccessRequisition,
  );
  const setShowCasualRequisition = useToggleStore(
    (state) => state.setShowCasualRequisition,
  );
  const setShowEmployeeRequisition = useToggleStore(
    (state) => state.setShowEmployeeRequisition,
  );

  const actions: QuickAction[] = [
    {
      label: "IT Requisition",
      description: "Submit an IT Requisition",
      Icon: Monitor,
      onClick: () => setShowITRequisition(true),
    },
    {
      label: "Travel Requisition",
      description: "Submit a travel request",
      Icon: BriefcaseBusiness,
      onClick: () => setShowTravelRequisition(true),
    },
    {
      label: "Access / Key Requisition",
      description: "Request physical access or keys",
      Icon: LockKeyhole,
      onClick: () => setShowAccessRequisition(true),
    },
    {
      label: "Casual Requisition",
      description: "Request casual labor",
      Icon: HardHat,
      onClick: () => setShowCasualRequisition(true),
    },
    {
      label: "Employee Requisition",
      description: "Request new or replacement headcount",
      Icon: UserRoundPlus,
      onClick: () => setShowEmployeeRequisition(true),
    },
    {
      label: "Salary Advance",
      description: "Apply for a salary advance",
      Icon: CircleDollarSign,
      href: "/dashboard/advance",
    },
    {
      label: "Staff Purchase",
      description: "Submit a purchase request",
      Icon: ShoppingBag,
      href: "/dashboard/staffproductpurchase",
    },
    {
      label: "IT HelpDesk",
      description: "Log or track an IT support ticket",
      Icon: LaptopMinimalCheck,
      href: "/dashboard/helpdesk",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(({ label, description, Icon, href, onClick }) => {
        const content = (
          <>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="block text-sm font-semibold text-[#1e1b1b]">
                {label}
              </span>
              <span className="block text-xs text-[#a18080]">
                {description}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-400" />
          </>
        );

        const className =
          "group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-4 text-left shadow-[0_12px_24px_rgba(160,60,60,0.05)] transition-all hover:border-red-200 hover:bg-white/80";

        return href ? (
          <Link key={label} href={href} className={className}>
            {content}
          </Link>
        ) : (
          <button key={label} onClick={onClick} className={className}>
            {content}
          </button>
        );
      })}
    </div>
  );
};

export default DashboardQuickActions;
