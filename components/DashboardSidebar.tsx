"use client";

import Link from "next/link";

import DashboardBrand from "./DashboardBrand";
import UserDropdown from "./UserDropDown";
import {
  BriefcaseBusiness,
  ChevronLeft,
  CircleQuestionMark,
  LayoutDashboard,
  Monitor,
  ShoppingBag,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// Summarized labels for tight vertical sidebar space
const links = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/dashboard/itrequisition", label: "IT Req", Icon: Monitor },
  {
    href: "/dashboard/travelrequisition",
    label: "Travel",
    Icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/staffproductpurchase",
    label: "Purchase",
    Icon: ShoppingBag,
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  const router = useRouter();

  return (
    <aside className="fixed top-1 bottom-1 left-1 z-50 hidden w-18 flex-col items-center py-4 lg:flex">
      {/* Brand (Icon Only) */}
      <div className="mb-6">
        <DashboardBrand showText={false} />
      </div>

      {/* Vertical Navigation */}
      <nav className="sidebar-nav mb-2 flex w-full flex-1 flex-col items-center gap-2 px-1">
        {links.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-3 transition-all duration-300 active:scale-95 ${
                isActive
                  ? "bg-white text-red-950 shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={20}
                className={`transition-colors ${
                  isActive
                    ? "text-red-950"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
              <span className="text-center text-[10px] leading-tight font-semibold tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}

        {/* Go back button */}
        <button
          onClick={() => router.back()}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-3 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ChevronLeft size={20} />
          <span className="text-center text-[10px] leading-tight font-semibold tracking-wide">
            Back
          </span>
        </button>
      </nav>

      {/* User Dropdown at the Bottom */}
      <div className="mt-auto">
        <div className="flex flex-col items-center justify-center gap-4">
          <a
            href="/guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CircleQuestionMark className="h-5 w-5" />
          </a>
          <UserDropdown direction="up" />
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
