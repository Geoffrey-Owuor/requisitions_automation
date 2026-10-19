"use client";

import Link from "next/link";

import DashboardBrand from "./DashboardBrand";
import UserDropdown from "./UserDropDown";
import { ChevronLeft, LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ClientPortal from "./ClientPortal";
import { useLayoutEffect, useRef, useState } from "react";
import SidebarMoreMenu from "./SidebarMoreMenu";
import { useConfirmLeave } from "./Dashboard/UnsavedChangesGuard";
import { useUser } from "@/context/UserContext";
import {
  DashboardNavItem,
  GUIDELINES_NAV_ITEM,
  HOME_NAV_ITEM,
  getDashboardNavGroups,
  isNavItemActive,
} from "@/lib/dashboardNav";

const RAIL_ITEM_CLASS =
  "group flex w-full shrink-0 flex-col items-center justify-center gap-1 rounded-surface py-2 text-[11px] leading-tight font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95";

const railItemClass = (highlighted: boolean) =>
  `${RAIL_ITEM_CLASS} ${
    highlighted
      ? "bg-white text-red-950 shadow-md"
      : "text-white/75 hover:bg-white/10 hover:text-white"
  }`;

// Matches the list's gap-1.5
const RAIL_GAP_PX = 6;

const DashboardSidebar = () => {
  const pathname = usePathname();

  const router = useRouter();

  const roles = useUser().roles;

  // The browser's own Back button isn't guarded, but this one is
  const confirmLeave = useConfirmLeave();

  // Every page in the rail, Guidelines last as the first to overflow
  const items = [
    ...getDashboardNavGroups(roles).flatMap((group) => group.items),
    GUIDELINES_NAV_ITEM,
  ];

  // How many items fit the rail's height; the rest go into More, which takes
  // the next slot. All items render until the first measurement.
  const [visibleCount, setVisibleCount] = useState(items.length);
  const spaceRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemHeightRef = useRef(0);
  const itemCount = items.length;

  useLayoutEffect(() => {
    const space = spaceRef.current;
    if (!space) return;

    const measure = () => {
      // Every rail item has the same height; remember it for when none show
      const firstItem = listRef.current?.firstElementChild as HTMLElement;
      if (firstItem) itemHeightRef.current = firstItem.offsetHeight;
      const itemHeight = itemHeightRef.current;
      if (!itemHeight) return;

      const fits = Math.floor(
        (space.clientHeight + RAIL_GAP_PX) / (itemHeight + RAIL_GAP_PX),
      );
      setVisibleCount(fits >= itemCount ? itemCount : Math.max(fits - 1, 0));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(space);
    return () => observer.disconnect();
  }, [itemCount]);

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);

  return (
    <aside className="custom:flex w-dashboard-sidebar fixed top-1 bottom-1 left-0 z-50 hidden flex-col items-center pt-0 pb-2">
      {/* Brand (Icon Only) */}
      <DashboardBrand />

      <nav
        aria-label="Main"
        className="mt-1 mb-2 flex min-h-0 w-full flex-1 flex-col gap-1.5 overflow-hidden px-2"
      >
        <RailLink
          item={HOME_NAV_ITEM}
          isActive={isNavItemActive(HOME_NAV_ITEM, pathname)}
        />
        <div aria-hidden="true" className="mx-3 my-0.5 h-px bg-white/10" />

        {/* Measured: the space left under Home */}
        <div ref={spaceRef} className="flex min-h-0 flex-1 flex-col">
          <ul ref={listRef} className="flex flex-col gap-1.5">
            {visibleItems.map((item) => (
              <li key={item.key}>
                <RailLink
                  item={item}
                  isActive={isNavItemActive(item, pathname)}
                />
              </li>
            ))}
            {overflowItems.length > 0 && (
              <li>
                <SidebarMoreMenu
                  items={overflowItems}
                  pathname={pathname}
                  buttonClassName={railItemClass}
                />
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Back and the user menu at the bottom */}
      <div className="flex w-full flex-col items-center justify-center gap-1.5 px-2">
        <RailButton
          label="Back"
          tooltip="Go Back"
          Icon={ChevronLeft}
          handleClick={() => confirmLeave(() => router.back())}
        />
        <UserDropdown direction="up" />
      </div>
    </aside>
  );
};

export default DashboardSidebar;

// Hover/focus tooltip with the item's full name, portaled out of the rail's
// overflow clip
const useRailTooltip = () => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const show = (e: React.SyntheticEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ top: rect.top + rect.height / 2, left: rect.right });
  };
  const hide = () => setCoords(null);

  return {
    handlers: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        // Keyboard focus only, not the focus a click leaves behind
        if (e.currentTarget.matches(":focus-visible")) show(e);
      },
      onBlur: hide,
    },
    renderTooltip: (text: string) =>
      coords && (
        <ClientPortal>
          <div
            role="presentation"
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-9999 ml-3 -translate-y-1/2"
          >
            <div className="rounded-compact relative bg-neutral-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg">
              {text}

              {/* Tooltip Tail/Arrow pointing left */}
              <div className="absolute top-1/2 -left-1 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-sm bg-neutral-900" />
            </div>
          </div>
        </ClientPortal>
      ),
  };
};

const RailLink = ({
  item,
  isActive,
}: {
  item: DashboardNavItem;
  isActive: boolean;
}) => {
  const { handlers, renderTooltip } = useRailTooltip();

  return (
    <>
      <Link
        href={item.href}
        aria-label={
          item.external ? `${item.label} (opens in a new tab)` : item.label
        }
        aria-current={isActive ? "page" : undefined}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        {...handlers}
        className={railItemClass(isActive)}
      >
        <item.Icon className="h-5 w-5" />
        <span className="max-w-full truncate px-1">{item.shortLabel}</span>
      </Link>
      {renderTooltip(item.label)}
    </>
  );
};

const RailButton = ({
  label,
  tooltip,
  Icon,
  handleClick,
}: {
  label: string;
  tooltip: string;
  Icon: LucideIcon;
  handleClick: () => void;
}) => {
  const { handlers, renderTooltip } = useRailTooltip();

  return (
    <>
      <button
        type="button"
        aria-label={tooltip}
        onClick={handleClick}
        {...handlers}
        className={railItemClass(false)}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </button>
      {renderTooltip(tooltip)}
    </>
  );
};
