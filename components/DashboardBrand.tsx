"use client";

import Image from "next/image";
import Link from "next/link";
import { assets } from "@/public/assets";
import { useState, useEffect, useRef } from "react";
import { useToggleStore } from "@/store/useToggleStore";
import {
  Brain,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardCheck,
  Cloud,
  FileSpreadsheet,
  FileText,
  Grip,
  HardHat,
  HousePlug,
  LaptopMinimalCheck,
  ListChecks,
  LockKeyhole,
  LucideIcon,
  Mail,
  Monitor,
  NotebookText,
  Presentation,
  Search,
  ShoppingBag,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";

type LauncherApp = {
  name: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

// TODO: Ensure your assets.hotpoint_logo points to a valid image path
const DashboardBrand = ({ showText = false }: { showText?: boolean }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the menu when clicking anywhere outside the trigger + dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setOpenMenu((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full p-2 hover:bg-white/10"
      >
        <div className="relative inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center">
          {isHovered ? (
            <Grip className="h-6 w-6 text-white" />
          ) : (
            <Image
              src={assets.hotpoint_black_logo}
              alt="IssueDesk Logo"
              sizes="32px"
              loading="eager"
              className="object-contain invert"
              fill // Added fill to fit safely inside the absolute container
              priority
            />
          )}
        </div>
        {showText && (
          <div className="flex flex-col gap-px leading-none">
            <span className="text-[14px] font-semibold text-[#1e1b1b]">
              Apps Hub
            </span>
            <span className="text-[11px] text-[#a18080]">
              Hotpoint Appliances
            </span>
          </div>
        )}
      </button>

      {openMenu && <AppMenu onClose={() => setOpenMenu(false)} />}
    </div>
  );
};

// App Menu Launcher - position should be fixed just below the logo icon
const AppMenu = ({ onClose }: { onClose: () => void }) => {
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

  const [query, setQuery] = useState("");

  // Internal apps + online forms - navigate within the app (Link/modal), never a new tab
  const internalApps: LauncherApp[] = [
    { name: "Home", icon: HousePlug, href: "/dashboard" },
    {
      name: "IT Requisition",
      icon: Monitor,
      onClick: () => setShowITRequisition(true),
    },
    {
      name: "Travel Requisition",
      icon: BriefcaseBusiness,
      onClick: () => setShowTravelRequisition(true),
    },
    {
      name: "Casual Requisition",
      icon: HardHat,
      onClick: () => setShowCasualRequisition(true),
    },
    {
      name: "Employee Requisition",
      icon: UserRoundPlus,
      onClick: () => setShowEmployeeRequisition(true),
    },
    {
      name: "Key & Access",
      icon: LockKeyhole,
      onClick: () => setShowAccessRequisition(true),
    },
    {
      name: "Salary Advance",
      icon: CircleDollarSign,
      href: "/dashboard/advance",
    },
    {
      name: "Staff Purchase",
      icon: ShoppingBag,
      href: "/dashboard/staffproductpurchase",
    },
    { name: "HelpDesk", icon: LaptopMinimalCheck, href: "/dashboard/helpdesk" },
  ];

  // External Microsoft 365 apps - always open in a new tab
  const microsoftApps: LauncherApp[] = [
    {
      name: "Outlook",
      icon: Mail,
      href: "https://outlook.cloud.microsoft",
      external: true,
    },
    {
      name: "OneDrive",
      icon: Cloud,
      href: "https://hotpointkenya-my.sharepoint.com/",
      external: true,
    },
    {
      name: "Teams",
      icon: UsersRound,
      href: "https://teams.cloud.microsoft",
      external: true,
    },
    {
      name: "Word",
      icon: FileText,
      href: "https://word.cloud.microsoft",
      external: true,
    },
    {
      name: "Excel",
      icon: FileSpreadsheet,
      href: "https://excel.cloud.microsoft",
      external: true,
    },
    {
      name: "PowerPoint",
      icon: Presentation,
      href: "https://powerpoint.cloud.microsoft",
      external: true,
    },
    {
      name: "OneNote",
      icon: NotebookText,
      href: "https://onenote.cloud.microsoft",
      external: true,
    },
    {
      name: "Copilot",
      icon: Brain,
      href: "https://copilot.cloud.microsoft",
      external: true,
    },
    {
      name: "To Do",
      icon: ListChecks,
      href: "https://to-do.office.com",
      external: true,
    },
    {
      name: "Forms",
      icon: ClipboardCheck,
      href: "https://forms.office.com",
      external: true,
    },
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const filteredInternal = normalizedQuery
    ? internalApps.filter((app) =>
        app.name.toLowerCase().includes(normalizedQuery),
      )
    : internalApps;
  const filteredMicrosoft = normalizedQuery
    ? microsoftApps.filter((app) =>
        app.name.toLowerCase().includes(normalizedQuery),
      )
    : microsoftApps;
  const hasResults =
    filteredInternal.length > 0 || filteredMicrosoft.length > 0;

  return (
    <div className="absolute top-11 left-0 z-50 w-88 overflow-hidden rounded-[28px] bg-white shadow-2xl transition-all">
      {/* Search */}
      <div className="border-b border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3.5 py-2.5 focus-within:ring-1 focus-within:ring-rose-400">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps and forms"
            autoFocus
            className="w-full bg-transparent text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable app list - capped height so the drawer never grows too tall */}
      <div className="small-scrollbar max-h-96 overflow-y-auto p-4 pt-3">
        {!hasResults && (
          <p className="py-8 text-center text-[12px] font-medium text-gray-400">
            No apps or forms match &ldquo;{query}&rdquo;
          </p>
        )}

        {filteredInternal.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 px-1 text-[10px] font-bold tracking-[0.14em] text-gray-400 uppercase">
              Apps &amp; Forms
            </p>
            <div className="grid grid-cols-3 gap-2">
              {filteredInternal.map((app) => (
                <AppTile key={app.name} app={app} onSelect={onClose} />
              ))}
            </div>
          </div>
        )}

        {filteredMicrosoft.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[10px] font-bold tracking-[0.14em] text-gray-400 uppercase">
              Microsoft 365
            </p>
            <div className="grid grid-cols-3 gap-2">
              {filteredMicrosoft.map((app) => (
                <AppTile key={app.name} app={app} onSelect={onClose} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Single app/form tile - renders as an internal Link, an external anchor, or an action button
const AppTile = ({
  app,
  onSelect,
}: {
  app: LauncherApp;
  onSelect: () => void;
}) => {
  const Icon = app.icon;
  const className =
    "group flex flex-col items-center justify-center rounded-2xl p-2.5 transition-all duration-200 hover:bg-red-50/60 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:outline-none active:scale-95";

  const tileContent = (
    <>
      {/* Icon Tile */}
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50/80 text-gray-600 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:bg-white group-hover:text-red-600 group-hover:shadow-md group-hover:ring-red-100">
        <Icon
          className="h-6 w-6 transition-transform duration-200 group-hover:scale-105"
          strokeWidth={1.75}
        />
      </div>

      {/* App Label */}
      <span className="max-w-full truncate text-[11px] font-semibold text-gray-600 transition-colors duration-200 group-hover:text-gray-900">
        {app.name}
      </span>
    </>
  );

  if (app.href && app.external) {
    return (
      <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={className}
      >
        {tileContent}
      </a>
    );
  }

  if (app.href) {
    return (
      <Link href={app.href} onClick={onSelect} className={className}>
        {tileContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        app.onClick?.();
        onSelect();
      }}
      className={className}
    >
      {tileContent}
    </button>
  );
};

export default DashboardBrand;
