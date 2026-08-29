"use client";

import { useState } from "react";
import Brand from "./Brand";
import { BookText, CircleGauge } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const onGuidelines = pathname.startsWith("/guidelines");
  const onLogin = pathname.startsWith("/login");

  return (
    <header className="bg-canvas/85 sticky top-0 z-50 border-b border-slate-200 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Brand showText={true} />

        <nav className="flex items-center gap-1.5">
          {/* The login page already is the sign-in surface, and the guidelines
              page is reached from every other surface — so each drops the link
              that would point back at itself. */}
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
};

export default Header;
