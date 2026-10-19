"use client";

import Image from "next/image";
import Link from "next/link";
import { assets } from "@/public/assets";
import { useState, useEffect, useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  DashboardNavItem,
  GUIDELINES_NAV_ITEM,
  HOME_NAV_ITEM,
  getDashboardNavGroups,
  isNavItemActive,
} from "@/lib/dashboardNav";
import {
  ExternalLink,
  LayoutGrid,
  LucideIcon,
  Search,
  X,
} from "lucide-react";

type LauncherApp = {
  key: string;
  name: string;
  href: string;
  external?: boolean;
  keywords?: string[];
  // A Lucide icon, or an official product icon from /public
  Icon?: LucideIcon;
  iconSrc?: string;
  // Path prefix the app is active under, for internal apps
  navItem?: DashboardNavItem;
};

type LauncherSection = { key: string; label: string; apps: LauncherApp[] };

// Microsoft's product icons (the October 2025 designs), served from
// public/icons/m365. The SVGs come from selfh.st/icons (CC BY 4.0); Copilot is
// Microsoft's own 48px PNG, since that set only has the older Copilot logo.
const MICROSOFT_APPS: LauncherApp[] = [
  {
    key: "m365-outlook",
    name: "Outlook",
    iconSrc: "/icons/m365/outlook.svg",
    href: "https://outlook.cloud.microsoft",
    keywords: ["mail", "email", "calendar", "inbox"],
  },
  {
    key: "m365-onedrive",
    name: "OneDrive",
    iconSrc: "/icons/m365/onedrive.svg",
    href: "https://hotpointkenya-my.sharepoint.com/",
    keywords: ["files", "storage", "documents", "share"],
  },
  {
    key: "m365-teams",
    name: "Teams",
    iconSrc: "/icons/m365/teams.svg",
    href: "https://teams.cloud.microsoft",
    keywords: ["chat", "meeting", "call", "video"],
  },
  {
    key: "m365-word",
    name: "Word",
    iconSrc: "/icons/m365/word.svg",
    href: "https://word.cloud.microsoft",
    keywords: ["document", "docs", "letter"],
  },
  {
    key: "m365-excel",
    name: "Excel",
    iconSrc: "/icons/m365/excel.svg",
    href: "https://excel.cloud.microsoft",
    keywords: ["spreadsheet", "sheets", "workbook"],
  },
  {
    key: "m365-powerpoint",
    name: "PowerPoint",
    iconSrc: "/icons/m365/powerpoint.svg",
    href: "https://powerpoint.cloud.microsoft",
    keywords: ["slides", "presentation", "deck"],
  },
  {
    key: "m365-onenote",
    name: "OneNote",
    iconSrc: "/icons/m365/onenote.svg",
    href: "https://onenote.cloud.microsoft",
    keywords: ["notes", "notebook"],
  },
  {
    key: "m365-copilot",
    name: "Copilot",
    iconSrc: "/icons/m365/copilot.png",
    href: "https://copilot.cloud.microsoft",
    keywords: ["ai", "assistant", "chat"],
  },
  {
    key: "m365-todo",
    name: "To Do",
    iconSrc: "/icons/m365/todo.svg",
    href: "https://to-do.office.com",
    keywords: ["tasks", "todo", "list", "reminders"],
  },
  {
    key: "m365-forms",
    name: "Forms",
    iconSrc: "/icons/m365/forms.svg",
    href: "https://forms.office.com",
    keywords: ["survey", "quiz", "poll"],
  },
].map((app) => ({ ...app, external: true }));

const fromNavItem = (item: DashboardNavItem): LauncherApp => ({
  key: item.key,
  name: item.label,
  href: item.href,
  external: item.external,
  keywords: item.keywords,
  Icon: item.Icon,
  navItem: item,
});

// Last few apps opened from the menu, per browser. Storage can be missing or
// throw (private windows, blocked site data), so every access is guarded.
const RECENT_APPS_KEY = "Requisitions_Automation_recentApps";
const RECENT_APPS_LIMIT = 3;

const readRecentApps = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_APPS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((k) => typeof k === "string")
      : [];
  } catch {
    return [];
  }
};

const rememberRecentApp = (key: string) => {
  try {
    const recent = [key, ...readRecentApps().filter((k) => k !== key)];
    localStorage.setItem(
      RECENT_APPS_KEY,
      JSON.stringify(recent.slice(0, RECENT_APPS_LIMIT)),
    );
  } catch {
    // Not remembered; the menu works the same without it
  }
};

// Name matches first, then keyword matches
const searchApps = (apps: LauncherApp[], query: string) => {
  const byName = apps.filter((app) => app.name.toLowerCase().includes(query));
  const byKeyword = apps.filter(
    (app) =>
      !byName.includes(app) && app.keywords?.some((k) => k.includes(query)),
  );
  return [...byName, ...byKeyword];
};

const DashboardBrand = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const pathname = usePathname();

  // Close on navigation, however it started
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpenMenu(false);
  }

  // Close when pressing anywhere outside the trigger + menu
  useEffect(() => {
    if (!openMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenu]);

  const closeAndFocusTrigger = () => {
    setOpenMenu(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && openMenu) {
          e.preventDefault();
          closeAndFocusTrigger();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Apps"
        aria-haspopup="dialog"
        aria-expanded={openMenu}
        aria-controls={openMenu ? panelId : undefined}
        onClick={() => setOpenMenu((prev) => !prev)}
        className="group relative flex cursor-pointer items-center rounded-full p-2 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span className="relative inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center">
          <Image
            src={assets.hotpoint_black_logo}
            alt=""
            sizes="32px"
            className="object-contain invert"
            fill
            preload
          />
          {/* Always-visible hint that the logo opens the app menu */}
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -bottom-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-red-950 ring-2 ring-red-950"
          >
            <LayoutGrid className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
        </span>

        {/* Tooltip on hover and keyboard focus, hidden while open */}
        {!openMenu && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Apps
          </span>
        )}
      </button>

      {openMenu && (
        <AppMenu
          id={panelId}
          pathname={pathname}
          onClose={() => setOpenMenu(false)}
        />
      )}
    </div>
  );
};

// App launcher: a popover beside the logo from the custom breakpoint up, a
// full-width sheet under the header below it
const AppMenu = ({
  id,
  pathname,
  onClose,
}: {
  id: string;
  pathname: string;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [recentKeys] = useState(readRecentApps);
  const { roles } = useUser();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Start in the search box with a mouse; on touch screens that would raise
  // the on-screen keyboard over the tiles, so start on the panel instead
  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      searchRef.current?.focus();
    } else {
      panelRef.current?.focus();
    }
  }, []);

  const internalSections: LauncherSection[] = [
    ...getDashboardNavGroups(roles).map((group) => ({
      key: group.key,
      label: group.label,
      apps: group.items.map(fromNavItem),
    })),
    {
      key: "hub",
      label: "Hub",
      apps: [HOME_NAV_ITEM, GUIDELINES_NAV_ITEM].map(fromNavItem),
    },
  ];
  const allSections: LauncherSection[] = [
    ...internalSections,
    { key: "m365", label: "Microsoft 365", apps: MICROSOFT_APPS },
  ];
  const allApps = allSections.flatMap((section) => section.apps);

  const normalizedQuery = query.trim().toLowerCase();
  const recentApps = recentKeys
    .map((key) => allApps.find((app) => app.key === key))
    .filter((app): app is LauncherApp => !!app);

  // While searching, one ranked list of matches; otherwise the sections,
  // with recently used apps first
  const sections: LauncherSection[] = normalizedQuery
    ? [
        {
          key: "results",
          label: "Results",
          apps: searchApps(allApps, normalizedQuery),
        },
      ].filter((section) => section.apps.length > 0)
    : [
        ...(recentApps.length > 0
          ? [{ key: "recent", label: "Recent", apps: recentApps }]
          : []),
        ...allSections,
      ];
  const resultCount = sections.reduce((n, s) => n + s.apps.length, 0);

  const tiles = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("[data-app-tile]") ?? [],
    );

  // Arrow keys move between tiles by position, so Up/Down also cross
  // between sections; Up from the top row returns to the search box
  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    const current = e.target as HTMLElement;
    if (!current.matches("[data-app-tile]")) return;
    const all = tiles();
    const index = all.indexOf(current);

    const focusVertical = (direction: 1 | -1) => {
      const from = current.getBoundingClientRect();
      const centre = from.left + from.width / 2;
      const candidates = all
        .map((tile) => ({ tile, rect: tile.getBoundingClientRect() }))
        .filter(({ rect }) =>
          direction === 1 ? rect.top > from.top + 1 : rect.top < from.top - 1,
        );
      if (candidates.length === 0) {
        if (direction === -1) searchRef.current?.focus();
        return;
      }
      const rowTop = candidates.reduce(
        (best, { rect }) =>
          Math.abs(rect.top - from.top) < Math.abs(best - from.top)
            ? rect.top
            : best,
        candidates[0].rect.top,
      );
      const row = candidates.filter(({ rect }) => rect.top === rowTop);
      const closest = row.reduce((best, entry) =>
        Math.abs(entry.rect.left + entry.rect.width / 2 - centre) <
        Math.abs(best.rect.left + best.rect.width / 2 - centre)
          ? entry
          : best,
      );
      closest.tile.focus();
    };

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        all[Math.min(index + 1, all.length - 1)]?.focus();
        break;
      case "ArrowLeft":
        e.preventDefault();
        all[Math.max(index - 1, 0)]?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        focusVertical(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusVertical(-1);
        break;
      case "Home":
        e.preventDefault();
        all[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        all[all.length - 1]?.focus();
        break;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      tiles()[0]?.focus();
    } else if (e.key === "Enter" && normalizedQuery) {
      // A real click on the top match, so the unsaved-changes guard and
      // new-tab links behave exactly as if it were clicked
      e.preventDefault();
      tiles()[0]?.click();
    }
  };

  const handleSelect = (app: LauncherApp) => {
    rememberRecentApp(app.key);
    onClose();
  };

  return (
    <>
      {/* Dims the page under the sheet below the custom breakpoint */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="custom:hidden fixed inset-x-0 top-16 bottom-0 bg-black/30"
      />

      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-label="Apps"
        tabIndex={-1}
        className="custom:absolute custom:inset-x-auto custom:top-full custom:left-0 custom:mt-1 custom:w-88 custom:max-h-[min(36rem,calc(100dvh-5rem))] fixed inset-x-2 top-16 z-60 flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none sm:right-auto sm:w-104"
      >
        {/* Search */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 p-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-red-950/30">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-gray-500"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search apps and forms"
              aria-label="Search apps and forms"
              aria-controls={`${id}-results`}
              className="w-full bg-transparent text-[13px] text-gray-800 placeholder:text-gray-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="shrink-0 rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close apps"
            className="custom:hidden shrink-0 rounded-full p-2 text-gray-500 outline-none hover:bg-red-50 hover:text-red-950 focus-visible:ring-2 focus-visible:ring-red-950/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {normalizedQuery
            ? `${resultCount} ${resultCount === 1 ? "result" : "results"}`
            : ""}
        </p>

        {/* Scrollable app list */}
        <div
          id={`${id}-results`}
          onKeyDown={handleGridKeyDown}
          className="small-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-3"
        >
          {resultCount === 0 && (
            <p className="py-8 text-center text-[12px] font-medium text-gray-500">
              No apps or forms match &ldquo;{query}&rdquo;
            </p>
          )}

          {sections.map((section) => (
            <section
              key={section.key}
              aria-labelledby={`${id}-${section.key}`}
              className="mb-4 last:mb-0"
            >
              <h2
                id={`${id}-${section.key}`}
                className="mb-2 px-1 text-[10px] font-bold tracking-[0.14em] text-gray-500 uppercase"
              >
                {section.label}
              </h2>
              <ul className="grid grid-cols-3 gap-1.5">
                {section.apps.map((app) => (
                  <li key={app.key}>
                    <AppTile
                      app={app}
                      isActive={
                        !!app.navItem && isNavItemActive(app.navItem, pathname)
                      }
                      onSelect={handleSelect}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
};

// Single app/form tile - renders as an internal Link or an external anchor
const AppTile = ({
  app,
  isActive,
  onSelect,
}: {
  app: LauncherApp;
  isActive: boolean;
  onSelect: (app: LauncherApp) => void;
}) => {
  const className = `group relative flex h-full flex-col items-center rounded-2xl px-1.5 pt-2.5 pb-2 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-950/40 active:scale-95 ${
    isActive ? "bg-red-50" : "hover:bg-red-50/70"
  }`;

  const tileContent = (
    <>
      {/* Icon Tile */}
      <span
        className={`mb-1.5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all duration-200 group-hover:shadow-md ${
          isActive
            ? "bg-red-950 text-white ring-red-950"
            : "bg-white text-gray-600 ring-black/5 group-hover:text-red-950 group-hover:ring-red-100"
        }`}
      >
        {app.iconSrc ? (
          <Image src={app.iconSrc} alt="" width={28} height={28} />
        ) : (
          app.Icon && (
            <app.Icon
              className={`h-6 w-6 ${app.external ? "text-violet-600" : ""}`}
              strokeWidth={1.75}
            />
          )
        )}
      </span>

      {/* App Label - up to two lines */}
      <span
        className={`line-clamp-2 text-center text-[11.5px] leading-tight font-semibold ${
          isActive ? "text-red-950" : "text-gray-700 group-hover:text-gray-900"
        }`}
      >
        {app.name}
      </span>

      {app.external && (
        <>
          <ExternalLink
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 h-3 w-3 text-gray-400"
          />
          <span className="sr-only">(opens in a new tab)</span>
        </>
      )}
    </>
  );

  if (app.external) {
    return (
      <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        data-app-tile
        onClick={() => onSelect(app)}
        className={className}
      >
        {tileContent}
      </a>
    );
  }

  return (
    <Link
      href={app.href}
      data-app-tile
      aria-current={isActive ? "page" : undefined}
      onClick={() => onSelect(app)}
      className={className}
    >
      {tileContent}
    </Link>
  );
};

export default DashboardBrand;
