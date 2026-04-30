import Link from "next/link";
import Brand from "./Brand";
import { ExternalLink } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-xs font-medium text-slate-600 transition-colors hover:text-rose-600 sm:text-sm"
          >
            Login
          </Link>
          <a
            href="http://192.168.0.27:10556"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-95 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
          >
            <span className="hidden sm:inline">Purchase Portal</span>
            <span className="sm:hidden">Portal</span>
            <ExternalLink size={14} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
