"use client";

import Link from "next/link";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import { LayoutDashboard, Monitor, Plane } from "lucide-react";
import { usePathname } from "next/navigation";
import { initialsHelper } from "@/public/assets";
import { useUser } from "@/context/UserContext";

// Summarized labels for tight vertical sidebar space
const links = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/dashboard/itrequisition", label: "IT Req", Icon: Monitor },
  { href: "/dashboard/travelrequisition", label: "Travel", Icon: Plane },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  const { username, email } = useUser();

  const initials = initialsHelper(username ? username : "GU");

  return (
    <aside className="fixed top-1 bottom-1 left-1 z-50 hidden w-18 flex-col items-center py-4 lg:flex">
      {/* Brand (Icon Only) */}
      <div className="mb-8">
        <Brand showText={false} />
      </div>

      {/* Vertical Navigation */}
      <nav className="flex w-full flex-col items-center gap-3 px-1">
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
      </nav>

      {/* User Dropdown at the Bottom */}
      <div className="mt-auto">
        {/* TODO: Pass actual user auth states here instead of hardcoded strings */}
        <UserDropdown
          direction="up"
          initials={initials}
          userName={username}
          userEmail={email}
        />
      </div>
    </aside>
  );
};

export default DashboardSidebar;
