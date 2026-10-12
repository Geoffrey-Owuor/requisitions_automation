"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import DashboardBrand from "./DashboardBrand";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import {
  Menu,
  X,
  Monitor,
  CircleQuestionMark,
  Ellipsis,
  HardHat,
  LaptopMinimalCheck,
  ShoppingBag,
  HousePlug,
  Briefcase,
  LockKeyhole,
  CircleDollarSign,
  UserRoundPlus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { newRequisitionHref } from "@/lib/dashboardTables";
import MoreMenuModal from "./Modules/MoreMenuModal";
import { useUser } from "@/context/UserContext";
import { REPORTS_PAGE, canViewReports } from "@/lib/reports/definitions";

const links = [
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

  const isHomeActive = pathname === "/dashboard";
  const isAdvanceActive = pathname === "/dashboard/advance";
  const isReportsActive = pathname === REPORTS_PAGE.href;
  const showReports = canViewReports(useUser().roles);

  const closeSidebar = () => setSidebarOpen(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Move focus into the drawer when it opens and back to the menu button when
  // it closes (keyboard and screen-reader users), and close it on Escape
  useEffect(() => {
    if (sidebarOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSidebarOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* Overlay & Sliding Mobile Sidebar */}
      {/* inert while closed so the off-screen links can't be tabbed to */}
      <div
        inert={!sidebarOpen}
        className={`fixed inset-0 z-70 ${
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sliding Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`relative z-10 h-full ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } custom:hidden layout-scrollbar flex w-80 flex-col bg-white shadow-2xl transition-transform duration-200`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
            <Brand showText={true} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-950"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {/* Home Link */}
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                isHomeActive
                  ? "bg-red-950 text-white shadow-md"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-950"
              }`}
            >
              <HousePlug
                size={18}
                className={`transition-colors ${
                  isHomeActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-red-950"
                }`}
              />
              Home
            </Link>

            {/* IT Requisition */}
            <Link
              href={newRequisitionHref("it")}
              onClick={closeSidebar}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                pathname === newRequisitionHref("it")
                  ? "bg-red-950 text-white shadow-md"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-950"
              }`}
            >
              <Monitor
                size={18}
                className={`transition-colors ${
                  pathname === newRequisitionHref("it")
                    ? "text-white"
                    : "text-slate-500 group-hover:text-red-950"
                }`}
              />
              IT Requisition
            </Link>
            {/* Travel Requisition */}
            <Link
              href={newRequisitionHref("travel")}
              onClick={closeSidebar}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                pathname === newRequisitionHref("travel")
                  ? "bg-red-950 text-white shadow-md"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-950"
              }`}
            >
              <Briefcase
                size={18}
                className={`transition-colors ${
                  pathname === newRequisitionHref("travel")
                    ? "text-white"
                    : "text-slate-500 group-hover:text-red-950"
                }`}
              />
              Travel Requisition
            </Link>
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

            {/* Salary advance button */}
            <Link
              href="/dashboard/advance"
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                isAdvanceActive
                  ? "bg-red-950 text-white shadow-md"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-950"
              }`}
            >
              <CircleDollarSign
                size={18}
                className={`transition-colors ${
                  isAdvanceActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-red-950"
                }`}
              />
              Salary Advance
            </Link>

            {/* Reports - report role holders only */}
            {showReports && (
              <Link
                href={REPORTS_PAGE.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                  isReportsActive
                    ? "bg-red-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-red-50 hover:text-red-950"
                }`}
              >
                <REPORTS_PAGE.Icon
                  size={18}
                  className={`transition-colors ${
                    isReportsActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-red-950"
                  }`}
                />
                {REPORTS_PAGE.label}
              </Link>
            )}

            {/* More menu - holds secondary links (Guidelines, future additions) */}
            <MoreMenuModal
              align="bottom"
              triggerClassName="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-950"
              trigger={
                <>
                  <Ellipsis
                    size={18}
                    className="text-slate-500 transition-colors group-hover:text-red-950"
                  />
                  More
                </>
              }
              items={[
                {
                  key: "casual",
                  label: "Casual Requisition",
                  Icon: HardHat,
                  href: newRequisitionHref("casual"),
                  onClick: closeSidebar,
                },
                {
                  key: "employee",
                  label: "Employee Requisition",
                  Icon: UserRoundPlus,
                  href: newRequisitionHref("employee"),
                  onClick: closeSidebar,
                },
                {
                  key: "access",
                  label: "Key & Access",
                  Icon: LockKeyhole,
                  href: newRequisitionHref("access"),
                  onClick: closeSidebar,
                },
                {
                  key: "guidelines",
                  label: "Guidelines",
                  Icon: CircleQuestionMark,
                  onClick: closeSidebar,
                  href: "/guidelines",
                  external: true,
                },
              ]}
            />
          </nav>
        </aside>
      </div>

      {/* Top Header - Sits directly on the red-950 background */}
      <header className="custom:hidden fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between px-4">
        {/* Left Side: Menu Toggle + Icon Brand */}
        <div className="flex items-center gap-4">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            className="rounded-full p-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <Menu size={24} />
          </button>
          <DashboardBrand showText={false} />
        </div>

        {/* Right Side: User Dropdown and Guidelines Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/guidelines"
            aria-label="Guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <CircleQuestionMark className="h-5 w-5" />
          </Link>
          <UserDropdown direction="down" />
        </div>
      </header>
    </>
  );
};

export default MobileHeader;
