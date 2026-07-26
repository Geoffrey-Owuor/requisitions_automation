"use client";

import Link from "next/link";

import DashboardBrand from "./DashboardBrand";
import UserDropdown from "./UserDropDown";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CircleQuestionMark,
  HousePlug,
  LaptopMinimalCheck,
  LockKeyhole,
  LucideIcon,
  Monitor,
  ShoppingBag,
  Undo2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ClientPortal from "./ClientPortal";
import { useRef, useState, useEffect } from "react";
import ITRequisitionPage from "./ITRequisition/ITRequisitionPage";
import TravelRequisitionPage from "./TravelRequisitionPage";
import ModalWrapper from "./Modules/ModalWrapper";
import KeyAccessRequisitionForm from "./Modules/Retail/KeyAccessRequisitionForm";
import { useToggleStore } from "@/store/useToggleStore";

// Summarized labels for tight vertical sidebar space
const links = [
  {
    href: "/dashboard/staffproductpurchase",
    label: "Purchase",
    Icon: ShoppingBag,
    tooltip: "Staff Purchase",
    showTooltip: true,
  },
  {
    href: "/dashboard/helpdesk",
    label: "Helpdesk",
    Icon: LaptopMinimalCheck,
    tooltip: "HelpDesk",
    showTooltip: true,
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  const router = useRouter();

  // Zustand stores
  const showITRequisition = useToggleStore((state) => state.showITRequisition);
  const setShowITRequisition = useToggleStore(
    (state) => state.setShowITRequisition,
  );

  const showTravelRequisition = useToggleStore(
    (state) => state.showTravelRequisition,
  );
  const setShowTravelRequisition = useToggleStore(
    (state) => state.setShowTravelRequisition,
  );

  const showRetailForms = useToggleStore((state) => state.showRetailForms);
  const setShowRetailForms = useToggleStore(
    (state) => state.setShowRetailForms,
  );

  const showAccessRequisition = useToggleStore(
    (state) => state.showAccessRequisition,
  );
  const setShowAccessRequisition = useToggleStore(
    (state) => state.setShowAccessRequisition,
  );

  // Hr Zustand states
  const showHrForms = useToggleStore((state) => state.showHrForms);
  const setShowHrForms = useToggleStore((state) => state.setShowHrForms);

  // Refs for scroll targets
  const hrEndRef = useRef<HTMLDivElement>(null);
  const retailEndRef = useRef<HTMLDivElement>(null);

  // Scroll to HR bottom when opened
  useEffect(() => {
    if (showHrForms) {
      setTimeout(() => {
        hrEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    }
  }, [showHrForms]);

  // Scroll to Retail bottom when opened
  useEffect(() => {
    if (showRetailForms) {
      setTimeout(() => {
        retailEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    }
  }, [showRetailForms]);

  return (
    <>
      {/* IT Modal */}
      <ModalWrapper
        isOpen={showITRequisition}
        onClose={() => setShowITRequisition(false)}
      >
        <ITRequisitionPage />
      </ModalWrapper>

      {/* Travel Modal */}
      <ModalWrapper
        isOpen={showTravelRequisition}
        onClose={() => setShowTravelRequisition(false)}
      >
        <TravelRequisitionPage />
      </ModalWrapper>

      {/* Key Access Requisition Modal */}
      <ModalWrapper
        isOpen={showAccessRequisition}
        onClose={() => setShowAccessRequisition(false)}
      >
        <KeyAccessRequisitionForm />
      </ModalWrapper>

      <aside className="fixed top-1 bottom-1 left-0 z-50 hidden w-20 flex-col items-center pt-0 pb-2 lg:flex">
        {/* Brand (Icon Only) */}
        <DashboardBrand showText={false} />
        <div className="mx-auto mt-2 mb-2 w-full px-2">
          {/* Home */}
          <SideBarLink
            key="/dashboard"
            href="/dashboard"
            label="Home"
            Icon={HousePlug}
            tooltip="Dashboard"
            isActive={pathname === "/dashboard"}
            showToolTip={true}
          />
        </div>

        {/* Vertical Navigation */}
        <nav className="mb-2 flex w-full flex-1 scrollbar-none flex-col items-center gap-1.5 overflow-y-auto mask-[linear-gradient(to_bottom,transparent_0%,black_30px,black_calc(100%-30px),transparent_100%)] px-2">
          {/* IT Requisition */}
          <SideBarButton
            label="IT Req"
            handleClick={() => setShowITRequisition(true)}
            Icon={Monitor}
            showToolTip={true}
            toolTipMessage="IT Requisition"
          />
          {/* Travel Requisition */}
          <SideBarButton
            label="Travel"
            handleClick={() => setShowTravelRequisition(true)}
            Icon={BriefcaseBusiness}
            showToolTip={true}
            toolTipMessage="Travel Requisition"
          />
          {/* Home Link */}
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

          {/* Hr Button */}
          <SideBarButton
            label="HR"
            handleClick={() => setShowHrForms(!showHrForms)}
            Icon={showHrForms ? ChevronUp : ChevronDown}
            showToolTip={true}
            toolTipMessage="HR Forms"
          />

          {/* HR forms - Salary Advance Link, Casual Requisition(Later) */}
          {showHrForms && (
            <div className="flex w-full flex-col gap-1.5">
              <SideBarLink
                href="/dashboard/advance"
                key="/dashboard/advance"
                label="Advance"
                Icon={CircleDollarSign}
                tooltip="Salary Advance"
                isActive={pathname === "/dashboard/advance"}
                showToolTip={true}
              />
              {/* Invisible scroll target element */}
              <div ref={hrEndRef} />
            </div>
          )}

          {/* Retail Button */}
          <SideBarButton
            label="Retail"
            handleClick={() => setShowRetailForms(!showRetailForms)}
            Icon={showRetailForms ? ChevronUp : ChevronDown}
            showToolTip={true}
            toolTipMessage="Retail Forms"
          />

          {/* Access key button */}
          {showRetailForms && (
            <div className="flex w-full flex-col gap-1.5">
              <SideBarButton
                label="Access"
                handleClick={() => setShowAccessRequisition(true)}
                Icon={LockKeyhole}
                showToolTip={true}
                toolTipMessage="Access/Key Issuance"
              />
              {/* Invisible scroll target element */}
              <div ref={retailEndRef} />
            </div>
          )}
        </nav>

        {/* User Dropdown at the Bottom */}
        <div className="mt-auto w-full px-2">
          <div className="flex w-full flex-col items-center justify-center gap-4">
            {/* Go back button */}
            <SideBarButton
              label="Back"
              handleClick={() => router.back()}
              Icon={Undo2}
              showToolTip={true}
              toolTipMessage="Go Back"
            />
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
    </>
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
        className="flex w-full flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
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
