"use client";

import { useState } from "react";
import Brand from "./Brand";
import { BookText, CircleGauge, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const homeNavItems = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#forms", label: "Requisition Forms" },
  { href: "#portals", label: "Internal Portals" },
  { href: "#why-hub", label: "Why use the Hub" },
  { href: "#faq", label: "FAQs" },
];

const Header = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const onHome = pathname === "/";
  const onGuidelines = pathname.startsWith("/guidelines");
  const onLogin = pathname.startsWith("/login");

  /** Only the homepage has sections to scroll to, so only it gets the nav
   *  links and the logo-plus-drawer mobile layout. Every other page keeps
   *  the plain Login / Guidelines-or-Dashboard header. */
  if (!onHome) {
    return (
      <header className="bg-canvas/85 sticky top-0 z-50 border-b border-slate-200 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <Brand showText={true} />

          <nav className="flex items-center gap-1.5">
            {!onGuidelines && !onLogin && (
              <form
                action="/api/auth/login"
                method="GET"
                onSubmit={() => setIsLoading(true)}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-control hover:bg-brand-50 hover:text-brand-700 cursor-pointer px-3 py-2 text-sm font-medium text-slate-600 transition-colors disabled:opacity-60"
                >
                  {isLoading ? "Redirecting…" : "Login"}
                </button>
              </form>
            )}

            {onGuidelines ? (
              <Link
                href="/dashboard"
                className="rounded-control bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
              >
                <CircleGauge size={14} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/guidelines/travel"
                className="rounded-control bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
              >
                <BookText size={14} />
                <span>Guidelines</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-canvas/85 sticky top-0 z-50 border-b border-slate-200 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Brand showText={true} />

        <nav className="hidden items-center gap-1 md:flex">
          {homeNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-control hover:bg-brand-50 hover:text-brand-700 px-3 py-2 text-sm font-medium text-slate-600 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          <form
            action="/api/auth/login"
            method="GET"
            onSubmit={() => setIsLoading(true)}
          >
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-control hover:bg-brand-50 hover:text-brand-700 cursor-pointer px-3 py-2 text-sm font-medium text-slate-600 transition-colors disabled:opacity-60"
            >
              {isLoading ? "Redirecting…" : "Login"}
            </button>
          </form>

          <Link
            href="/guidelines/travel"
            className="rounded-control bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
          >
            <BookText size={14} />
            <span>Guidelines</span>
          </Link>
        </div>

        {/* Mobile: logo stays above, everything else moves into the drawer. */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="rounded-control hover:bg-brand-50 hover:text-brand-700 flex items-center justify-center p-2 text-slate-600 transition-colors md:hidden"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Drawer opens downward as an overlay, below the header, mobile-only. */}
      {isMenuOpen && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {homeNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-control hover:bg-brand-50 hover:text-brand-700 px-2 py-2.5 text-sm font-medium text-slate-600 transition-colors"
              >
                {item.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <form
                action="/api/auth/login"
                method="GET"
                onSubmit={() => setIsLoading(true)}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-control hover:bg-brand-50 hover:text-brand-700 w-full cursor-pointer px-2 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors disabled:opacity-60"
                >
                  {isLoading ? "Redirecting…" : "Login"}
                </button>
              </form>

              <Link
                href="/guidelines/travel"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-control bg-brand-600 hover:bg-brand-700 flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <BookText size={14} />
                <span>Guidelines</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
