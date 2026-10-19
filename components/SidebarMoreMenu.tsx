"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ellipsis, ExternalLink } from "lucide-react";
import { DashboardNavItem, isNavItemActive } from "@/lib/dashboardNav";

// The desktop rail's overflow: the links that don't fit the window height,
// in a dark popover beside the rail. Follows the WAI-ARIA menu button
// pattern: focus moves into the menu on open, arrow keys/Home/End move
// between items, Escape returns focus to the button, Tab closes it.
const GAP = 12;
const EDGE = 8;

export default function SidebarMoreMenu({
  items,
  pathname,
  buttonClassName,
}: {
  items: DashboardNavItem[];
  pathname: string;
  // The rail item's classes, highlighted while open or holding the current page
  buttonClassName: (highlighted: boolean) => string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  const activeIndex = items.findIndex((item) =>
    isNavItemActive(item, pathname),
  );
  const hasActive = activeIndex !== -1;

  // Close on navigation (including one started from the menu itself)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Fixed beside the button, so the rail's overflow clip can't cut it off,
  // and kept inside the viewport
  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;
    const button = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const top = Math.min(
      Math.max(EDGE, button.bottom - menuHeight),
      window.innerHeight - menuHeight - EDGE,
    );
    setPosition({ top, left: button.right + GAP });
    itemRefs.current[Math.max(activeIndex, 0)]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const closeAndFocusButton = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const links = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    const focusAt = (index: number) =>
      links[(index + links.length) % links.length]?.focus();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(links.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        closeAndFocusButton();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={
          hasActive ? `More (current: ${items[activeIndex].label})` : "More"
        }
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        className={buttonClassName(hasActive || open)}
      >
        <Ellipsis className="h-5 w-5" />
        <span>More</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="More pages"
          onKeyDown={handleMenuKeyDown}
          style={{ top: position.top, left: position.left }}
          className="fixed z-60 w-60 rounded-2xl bg-red-950 p-1.5 shadow-2xl ring-1 ring-white/10"
        >
          <p
            aria-hidden="true"
            className="px-3 pt-1.5 pb-1 text-[10px] font-bold tracking-[0.14em] text-white/50 uppercase"
          >
            More
          </p>
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                aria-current={isActive ? "page" : undefined}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                  isActive
                    ? "bg-white text-red-950"
                    : "text-white/80 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                }`}
              >
                <item.Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.external && (
                  <>
                    <ExternalLink
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 opacity-60"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
