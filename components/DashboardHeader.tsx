"use client";
import Link from "next/link";
import Brand from "./Brand";
import { LayoutDashboard, Monitor, Plane } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/itrequisition", label: "IT Requisition", Icon: Monitor },
  {
    href: "/dashboard/travelrequisition",
    label: "Travel Requisition",
    Icon: Plane,
  },
];

const DashboardHeader = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left Side: Brand */}
        <Brand />

        {/* Right Side: Pill Navigation */}
        <nav className="no-print flex items-center gap-1 rounded-full p-1.5">
          {links.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 active:scale-95 ${
                  isActive
                    ? // Unified active state: White text and White icon
                      "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700 hover:text-rose-600"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-700 group-hover:text-rose-600"
                  }`}
                />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default DashboardHeader;
