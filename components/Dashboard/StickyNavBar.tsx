"use client";

import { useEffect, useRef } from "react";

// A page's sticky link bar, passed as RequisitionPagesWrapper's `header`
// (after anything that should scroll away, such as the page title) so it
// spans the full page width. Opaque on purpose: backdrop-blur made the page
// scroll lag on 4K screens.
export function StickyNavBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-2">
        {children}
      </div>
    </div>
  );
}

// The bar's row of links. On narrow screens it scrolls sideways (its right
// edge fades out to show there's more) and brings the current link
// (aria-current) into view, again whenever the row's width changes (late
// styles or fonts, rotation) or `activeKey` changes.
export function ScrollingNav({
  label,
  activeKey,
  keepContentInView = false,
  className = "",
  children,
}: {
  label: string;
  activeKey: string;
  // Clicking a link while the bar is stuck scrolls back up to where the
  // page content starts, so a link that keeps the scroll position (a ?tab=
  // change) doesn't leave the viewer partway down the new content
  keepContentInView?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const reveal = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) return;
      if (
        active.offsetLeft < nav.scrollLeft ||
        active.offsetLeft + active.offsetWidth >
          nav.scrollLeft + nav.clientWidth
      ) {
        nav.scrollLeft = active.offsetLeft - 8;
      }
    };
    const observer = new ResizeObserver(reveal);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeKey]);

  const scrollToContent = (event: React.MouseEvent) => {
    if (!(event.target as HTMLElement).closest("a")) return;
    const bar = navRef.current?.closest(".sticky");
    const content = bar?.nextElementSibling;
    const scroller = bar?.closest(".layout-scrollbar");
    if (!(bar instanceof HTMLElement) || !content || !scroller) return;
    const contentTop =
      scroller.scrollTop +
      content.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      bar.offsetHeight;
    if (scroller.scrollTop > contentTop) {
      scroller.scrollTo({ top: contentTop, behavior: "instant" });
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label={label}
      onClick={keepContentInView ? scrollToContent : undefined}
      className={`relative flex min-w-0 flex-1 [scrollbar-width:none] items-center overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%_-_1.5rem),transparent)] pr-6 ${className}`}
    >
      {children}
    </nav>
  );
}
