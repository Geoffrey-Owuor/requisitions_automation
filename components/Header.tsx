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
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand showText={true} />
        {pathname !== "/guidelines" && (
          <nav className="flex items-center gap-4">
            <form
              action="/api/auth/login"
              method="GET"
              onSubmit={() => setIsLoading(true)}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:text-sm"
              >
                Login
              </button>
            </form>
            <Link
              href="/guidelines"
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-95 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
            >
              <BookText size={14} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Guidelines</span>
            </Link>
          </nav>
        )}
        {pathname === "/guidelines" && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-95 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
          >
            <CircleGauge size={14} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Dashboard</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
