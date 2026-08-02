"use client";

import { useState } from "react";
import Brand from "./Brand";
import { BookText, CircleGauge, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between rounded-full pr-2 pl-4 sm:pl-5">
          <Brand showText={true} />

          {pathname !== "/guidelines" ? (
            <nav className="flex items-center gap-1 sm:gap-2">
              <form
                action="/api/auth/login"
                method="GET"
                onSubmit={() => setIsLoading(true)}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 sm:px-4 sm:text-sm"
                >
                  <LogIn size={14} className="h-3.5 w-3.5" />
                  {isLoading ? "Redirecting…" : "Login"}
                </button>
              </form>
              <Link
                href="/guidelines"
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-linear-to-br from-rose-500 to-rose-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/35 active:scale-95 sm:gap-2 sm:px-5 sm:text-sm"
              >
                <span className="animate-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-[6px]" />
                <BookText size={14} className="h-3.5 w-3.5" />
                <span>Guidelines</span>
              </Link>
            </nav>
          ) : (
            <Link
              href="/dashboard"
              className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-linear-to-br from-rose-500 to-rose-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/35 active:scale-95 sm:gap-2 sm:px-5 sm:text-sm"
            >
              <span className="animate-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-[6px]" />
              <CircleGauge size={14} className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
