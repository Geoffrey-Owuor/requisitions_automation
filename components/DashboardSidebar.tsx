"use client";

import Link from "next/link";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import {
  BriefcaseBusiness,
  ChevronLeft,
  CircleQuestionMark,
  LayoutDashboard,
  Monitor,
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
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  const router = useRouter();

  return (
    <aside className="fixed top-1 bottom-1 left-1 z-50 hidden w-18 flex-col items-center py-4 lg:flex">
      {/* Brand (Icon Only) */}
      <div className="mb-6">
        <Brand showText={false} />
      </div>

      {/* Vertical Navigation */}
      <nav className="flex w-full flex-col items-center gap-2 px-1">
        {links.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-3 transition-all duration-300 active:scale-95 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <Icon
                size={20}
                className={`transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 group-hover:text-rose-600"
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
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-3 text-slate-600 transition-all duration-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
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
            className="rounded-full p-2 text-blue-600 hover:bg-blue-100/60"
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
