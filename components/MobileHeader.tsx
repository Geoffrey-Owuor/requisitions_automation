"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import DashboardBrand from "./DashboardBrand";
import Brand from "./Brand";
import UserDropdown from "./UserDropDown";
import { Menu, X, CircleQuestionMark, ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  DashboardNavItem,
  GUIDELINES_NAV_ITEM,
  HOME_NAV_ITEM,
  getDashboardNavGroups,
  isNavItemActive,
} from "@/lib/dashboardNav";

const MobileHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const groups = getDashboardNavGroups(useUser().roles);

  const closeSidebar = () => setSidebarOpen(false);

  // Close on navigation, however it started
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setSidebarOpen(false);
  }

  // A native modal <dialog> (styles: .modal-drawer in css/globals.css):
  // Escape, focus containment, the inert page and returning focus to the
  // menu button come from the browser
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sidebarOpen && !dialog.open) {
      dialog.showModal();
      // Start keyboard focus on the drawer, not the brand link
      dialog.focus();
    } else if (!sidebarOpen && dialog.open) {
      dialog.close();
    }
  }, [sidebarOpen]);

  // The drawer only exists below the custom breakpoint: close it if the
  // window grows past it, or the hidden dialog would keep the page inert
  useEffect(() => {
    if (!sidebarOpen) return;
    const desktop = window.matchMedia("(width >= 1200px)");
    const handleChange = () => {
      if (desktop.matches) setSidebarOpen(false);
    };
    handleChange();
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, [sidebarOpen]);

  return (
    <>
      <dialog
        ref={dialogRef}
        tabIndex={-1}
        aria-label="Navigation"
        onCancel={(e) => {
          e.preventDefault();
          closeSidebar();
        }}
        // A click on the dialog element itself landed on the backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSidebar();
        }}
        className="modal modal-drawer custom:hidden shadow-2xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 pr-4 pl-6">
          <Brand showText={true} />
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close menu"
            className="rounded-control p-2 text-slate-500 transition-colors outline-none hover:bg-red-50 hover:text-red-950 focus-visible:ring-2 focus-visible:ring-red-950/40"
          >
            <X size={20} />
          </button>
        </div>

        <nav
          aria-label="Main"
          className="layout-scrollbar flex min-h-0 flex-1 flex-col gap-5 overscroll-contain p-4"
        >
          <DrawerLink
            item={HOME_NAV_ITEM}
            isActive={isNavItemActive(HOME_NAV_ITEM, pathname)}
            onNavigate={closeSidebar}
          />

          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`drawer-${group.key}`}>
              <h2
                id={`drawer-${group.key}`}
                className="mb-1.5 px-4 text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase"
              >
                {group.label}
              </h2>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <DrawerLink
                      item={item}
                      isActive={isNavItemActive(item, pathname)}
                      onNavigate={closeSidebar}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <DrawerLink
            item={GUIDELINES_NAV_ITEM}
            isActive={false}
            onNavigate={closeSidebar}
          />
        </div>
      </dialog>

      {/* Top Header - Sits directly on the red-950 background */}
      <header className="custom:hidden fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between px-4">
        {/* Left Side: Menu Toggle + Icon Brand */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={sidebarOpen}
            className="rounded-control p-2.5 text-white/80 transition-all outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95"
          >
            <Menu size={24} />
          </button>
          <DashboardBrand />
        </div>

        {/* Right Side: User Dropdown and Guidelines Link */}
        <div className="flex items-center gap-2">
          <Link
            href={GUIDELINES_NAV_ITEM.href}
            aria-label="Guidelines (opens in a new tab)"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-control p-2.5 text-white/80 transition-all outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80"
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

const DrawerLink = ({
  item,
  isActive,
  onNavigate,
}: {
  item: DashboardNavItem;
  isActive: boolean;
  onNavigate: () => void;
}) => (
  <Link
    href={item.href}
    onClick={onNavigate}
    aria-current={isActive ? "page" : undefined}
    target={item.external ? "_blank" : undefined}
    rel={item.external ? "noopener noreferrer" : undefined}
    className={`group rounded-control flex min-h-11 items-center gap-3 px-4 py-2.5 text-[14px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-950/40 ${
      isActive
        ? "bg-red-950 text-white shadow-md"
        : "text-slate-700 hover:bg-red-50 hover:text-red-950"
    }`}
  >
    <item.Icon
      size={18}
      className={`shrink-0 transition-colors ${
        isActive ? "text-white" : "text-slate-500 group-hover:text-red-950"
      }`}
    />
    <span className="flex-1">{item.label}</span>
    {item.external && (
      <>
        <ExternalLink
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
        />
        <span className="sr-only">(opens in a new tab)</span>
      </>
    )}
  </Link>
);
