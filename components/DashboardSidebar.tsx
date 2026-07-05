"use client";

import Link from "next/link";

import DashboardBrand from "./DashboardBrand";
import UserDropdown from "./UserDropDown";
import {
  BriefcaseBusiness,
  ChevronLeft,
  CircleQuestionMark,
  HousePlug,
  LaptopMinimalCheck,
  LucideIcon,
  Monitor,
  ShoppingBag,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ClientPortal from "./ClientPortal";
import { useRef, useState } from "react";

// Summarized labels for tight vertical sidebar space
const links = [
  {
    href: "/dashboard",
    label: "Home",
    Icon: HousePlug,
    tooltip: "Dashboard",
    showTooltip: true,
  },
  {
    href: "/dashboard/itrequisition",
    label: "IT Req",
    Icon: Monitor,
    tooltip: "IT Requisition",
    showTooltip: true,
  },
  {
    href: "/dashboard/travelrequisition",
    label: "Travel",
    Icon: BriefcaseBusiness,
    tooltip: "Travel requisition",
    showTooltip: true,
  },
  {
    href: "/dashboard/staffproductpurchase",
    label: "Purchase",
    Icon: ShoppingBag,
    tooltip: "Staff Purchase",
    showTooltip: true,
  },
  {
    href: "/dashboard/helpdesk",
    label: "Desk",
    Icon: LaptopMinimalCheck,
    tooltip: "HelpDesk",
    showTooltip: true,
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  const router = useRouter();

  return (
    <aside className="fixed top-1 bottom-1 left-0 z-50 hidden w-20 flex-col items-center py-4 lg:flex">
      {/* Brand (Icon Only) */}
      <div className="mb-3.5">
        <DashboardBrand showText={false} />
      </div>

      {/* Vertical Navigation */}
      <nav className="sidebar-nav mb-2 flex w-full flex-1 flex-col items-center gap-1.5 px-2">
        {links.map(({ href, label, Icon, tooltip }) => {
          const isActive = pathname === href;
          return (
            <SideBarLink
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              tooltip={tooltip}
              isActive={isActive}
              showToolTip={true}
            />
          );
        })}

        {/* Go back button */}
        <SideBarButton
          label="Back"
          handleClick={() => router.back()}
          Icon={ChevronLeft}
          showToolTip={true}
          toolTipMessage="Go Back"
        />
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

// Reusable sidebar link function
type SideBarLinkProps = {
  href: string;
  label: string;
  Icon: LucideIcon;
  tooltip: string;
  showToolTip: boolean;
  isActive: boolean;
};
const SideBarLink = ({
  href,
  label,
  Icon,
  tooltip,
  showToolTip = true,
  isActive,
}: SideBarLinkProps) => {
  // 1. State to track hover and exact coordinates of the button
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    if (!showToolTip) return;

    // 2. Calculate exactly where the button is on the screen right now
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2, // Find the vertical center of the button
        left: rect.right, // Find the exact right edge of the button
      });
    }
    setIsHovered(true);
  };

  return (
    <>
      <Link
        ref={linkRef}
        href={href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`group flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
          isActive
            ? "bg-white text-red-950 shadow-md"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-colors ${
            isActive ? "text-red-950" : "text-white/70 group-hover:text-white"
          }`}
        />
        <span>{label}</span>
      </Link>
      {/* ── TOOLTIP (Rendered via Portal to escape the overflow trap) ── */}
      {showToolTip && tooltip && isHovered && (
        <ClientPortal>
          <div
            // Position it exactly where we calculated, using fixed so scrolling doesn't break it
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-9999 ml-3 -translate-y-1/2"
          >
            <div className="relative rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg">
              {tooltip}

              {/* Tooltip Tail/Arrow pointing left */}
              <div className="absolute top-1/2 -left-1 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-sm bg-neutral-900" />
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
};

type SideBarButtonProps = {
  label: string;
  handleClick: () => void;
  Icon: LucideIcon;
  showToolTip: boolean;
  toolTipMessage: string;
};

const SideBarButton = ({
  label,
  handleClick,
  Icon,
  showToolTip,
  toolTipMessage,
}: SideBarButtonProps) => {
  // 1. State to track hover and exact coordinates of the button
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const linkRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (!showToolTip) return;

    // 2. Calculate exactly where the button is on the screen right now
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2, // Find the vertical center of the button
        left: rect.right, // Find the exact right edge of the button
      });
    }
    setIsHovered(true);
  };

  return (
    <>
      <button
        ref={linkRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="flex w-full flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </button>
      {/* ── TOOLTIP (Rendered via Portal to escape the overflow trap) ── */}
      {showToolTip && toolTipMessage && isHovered && (
        <ClientPortal>
          <div
            // Position it exactly where we calculated, using fixed so scrolling doesn't break it
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-9999 ml-3 -translate-y-1/2"
          >
            <div className="relative rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg">
              {toolTipMessage}

              {/* Tooltip Tail/Arrow pointing left */}
              <div className="absolute top-1/2 -left-1 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-sm bg-neutral-900" />
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
};
