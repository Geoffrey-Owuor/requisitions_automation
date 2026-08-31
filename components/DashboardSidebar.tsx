"use client";

import Link from "next/link";

import DashboardBrand from "./DashboardBrand";
import UserDropdown from "./UserDropDown";
import {
  BriefcaseBusiness,
  ChevronLeft,
  CircleDollarSign,
  CircleQuestionMark,
  Ellipsis,
  HardHat,
  HousePlug,
  LaptopMinimalCheck,
  LockKeyhole,
  LucideIcon,
  Monitor,
  ShoppingBag,
  UserRoundPlus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ClientPortal from "./ClientPortal";
import { useRef, useState } from "react";
import ITRequisitionPage from "./ITRequisition/ITRequisitionPage";
import TravelRequisitionPage from "./TravelRequisitionPage";
import ModalWrapper from "./Modules/ModalWrapper";
import KeyAccessRequisitionForm from "./Modules/Retail/KeyAccessRequisitionForm";
import CasualRequisitionForm from "./Modules/Retail/CasualRequisitionForm";
import EmployeeRequisitionForm from "./Modules/Retail/EmployeeRequisitionForm";
import MoreMenuModal from "./Modules/MoreMenuModal";
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

  const showAccessRequisition = useToggleStore(
    (state) => state.showAccessRequisition,
  );
  const setShowAccessRequisition = useToggleStore(
    (state) => state.setShowAccessRequisition,
  );

  const showCasualRequisition = useToggleStore(
    (state) => state.showCasualRequisition,
  );
  const setShowCasualRequisition = useToggleStore(
    (state) => state.setShowCasualRequisition,
  );

  const showEmployeeRequisition = useToggleStore(
    (state) => state.showEmployeeRequisition,
  );
  const setShowEmployeeRequisition = useToggleStore(
    (state) => state.setShowEmployeeRequisition,
  );

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

      {/* Casual Requisition Modal */}
      <ModalWrapper
        isOpen={showCasualRequisition}
        onClose={() => setShowCasualRequisition(false)}
      >
        <CasualRequisitionForm />
      </ModalWrapper>

      {/* Employee Requisition Modal */}
      <ModalWrapper
        isOpen={showEmployeeRequisition}
        onClose={() => setShowEmployeeRequisition(false)}
      >
        <EmployeeRequisitionForm />
      </ModalWrapper>

      <aside className="custom:flex fixed top-1 bottom-1 left-0 z-50 hidden w-20 flex-col items-center pt-0 pb-2">
        {/* Brand (Icon Only) */}
        <DashboardBrand showText={false} />
        <div className="mx-auto mt-1 mb-2 w-full px-2">
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
        <nav className="mb-2 flex w-full flex-1 scrollbar-none flex-col items-center gap-1.5 overflow-y-auto mask-[linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-24px),transparent_100%)] px-2">
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

          {/* Salary Advance */}
          <SideBarLink
            href="/dashboard/advance"
            key="/dashboard/advance"
            label="Advance"
            Icon={CircleDollarSign}
            tooltip="Salary Advance"
            isActive={pathname === "/dashboard/advance"}
            showToolTip={true}
          />
        </nav>

        {/* User Dropdown at the Bottom */}
        <div className="mt-auto w-full px-2">
          <div className="flex w-full flex-col items-center justify-center gap-1.5">
            {/* Go back button */}
            <SideBarButton
              label="Back"
              handleClick={() => router.back()}
              Icon={ChevronLeft}
              showToolTip={true}
              toolTipMessage="Go Back"
            />
            {/* More menu - holds secondary links (Guidelines, future additions) */}
            <MoreMenuModal
              align="right"
              triggerClassName="flex w-full flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
              trigger={
                <>
                  <Ellipsis className="h-5 w-5" />
                  <span>More</span>
                </>
              }
              items={[
                {
                  key: "casual",
                  label: "Casual Requisition",
                  Icon: HardHat,
                  onClick: () => setShowCasualRequisition(true),
                },
                {
                  key: "employee",
                  label: "Employee Requisition",
                  Icon: UserRoundPlus,
                  onClick: () => setShowEmployeeRequisition(true),
                },
                {
                  key: "access",
                  label: "Key & Access",
                  Icon: LockKeyhole,
                  onClick: () => setShowAccessRequisition(true),
                },
                {
                  key: "guidelines",
                  label: "Guidelines",
                  Icon: CircleQuestionMark,
                  href: "/guidelines/travel",
                  external: true,
                },
              ]}
            />
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
