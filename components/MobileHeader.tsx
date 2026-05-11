"use client";

import { useState } from "react";
import Link from "next/link";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import { Menu, X, LayoutDashboard, Monitor, Plane } from "lucide-react";
import { usePathname } from "next/navigation";
import { initialsHelper } from "@/public/assets";
import { useUser } from "@/context/UserContext";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/itrequisition", label: "IT Requisition", Icon: Monitor },
  {
    href: "/dashboard/travelrequisition",
    label: "Travel Requisition",
    Icon: Plane,
  },
];

const MobileHeader = () => {
  const { username, email } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const initials = initialsHelper(username ? username : "GU");

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between px-4 lg:hidden">
        {/* Left Side: Menu Toggle + Icon Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 transition-all hover:bg-slate-100 active:scale-95"
          >
            <Menu size={24} />
          </button>
          <Brand showText={false} />
        </div>

        {/* Right Side: User Dropdown */}
        {/* TODO: Pass actual user auth states here instead of hardcoded strings */}
        <UserDropdown
          direction="down"
          initials={initials}
          userName={username}
          userEmail={email}
        />
      </header>

      {/* Overlay & Sliding Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sliding Panel */}
          <div className="animate-in slide-in-from-left-full fixed top-0 bottom-0 left-0 flex w-70 flex-col bg-white shadow-2xl duration-300">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
              <Brand showText={true} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 overflow-y-auto p-4">
              {links.map(({ href, label, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-slate-400"}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
