"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardBrand from "./DashboardBrand";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import {
  Menu,
  X,
  LayoutDashboard,
  Monitor,
  Plane,
  CircleQuestionMark,
  LaptopMinimalCheck,
  ShoppingBag,
} from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/dashboard/itrequisition", label: "IT Requisition", Icon: Monitor },
  {
    href: "/dashboard/travelrequisition",
    label: "Travel Requisition",
    Icon: Plane,
  },
  {
    href: "/dashboard/staffproductpurchase",
    label: "Staff Purchase",
    Icon: ShoppingBag,
  },
  {
    href: "/dashboard/helpdesk",
    label: "HelpDesk",
    Icon: LaptopMinimalCheck,
  },
];

const MobileHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Overlay & Sliding Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-70 ${
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sliding Panel */}
        <aside
          className={`relative z-10 h-full ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex w-64 flex-col bg-white shadow-2xl transition-transform duration-200`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
            <Brand showText={true} />
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-950"
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
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                    isActive
                      ? "bg-red-950 text-white shadow-md"
                      : "text-slate-600 hover:bg-red-50 hover:text-red-950"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-red-950"
                    }`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Top Header - Sits directly on the red-950 background */}
      <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between px-4 lg:hidden">
        {/* Left Side: Menu Toggle + Icon Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <Menu size={24} />
          </button>
          <DashboardBrand showText={false} />
        </div>

        {/* Right Side: User Dropdown and Guidelines Link */}
        <div className="flex items-center gap-4">
          <a
            href="/guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <CircleQuestionMark className="h-5 w-5" />
          </a>
          <UserDropdown direction="down" />
        </div>
      </header>
    </>
  );
};

export default MobileHeader;
