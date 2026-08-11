"use client";

import { useState } from "react";
import Brand from "./Brand";
import { BookText, CircleGauge } from "lucide-react";
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
                  {isLoading ? "Redirecting…" : "Login"}
                </button>
              </form>
              <Link
                href="/guidelines"
                className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 active:scale-95 sm:gap-2 sm:px-5 sm:text-sm"
              >
                <BookText size={14} className="h-3.5 w-3.5" />
                <span>Guidelines</span>
              </Link>
            </nav>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 active:scale-95 sm:gap-2 sm:px-5 sm:text-sm"
            >
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
