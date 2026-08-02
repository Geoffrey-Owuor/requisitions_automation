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
  HousePlug,
} from "lucide-react";
import { useToggleStore } from "@/store/useToggleStore";
import { useUser } from "@/context/UserContext";

type WelcomeAction = {
  label: string;
  description: string;
  Icon: LucideIcon;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

const DashboardWelcome = () => {
  const { username } = useUser();
  const firstName = username?.split(" ")[0];

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

  const actions: WelcomeAction[] = [
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
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/40 text-red-400 shadow-[0_8px_16px_rgba(160,60,60,0.08)] backdrop-blur-md">
        <HousePlug size={32} strokeWidth={1.5} />
      </div>

      <h2 className="text-xl font-semibold text-[#1e1b1b]">
        Welcome{firstName ? `, ${firstName}` : ""}
      </h2>
      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-[#a18080]">
        You don&apos;t have any requisitions yet. Get started with one of the
        actions below.
      </p>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            "group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-4 text-left shadow-[0_12px_24px_rgba(160,60,60,0.05)] backdrop-blur-xl transition-all hover:border-red-200 hover:bg-white/80";

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
    </div>
  );
};

export default DashboardWelcome;
