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
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Brand />

        <nav className="no-print flex items-center gap-1">
          {links.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#1e1b1b] text-white"
                    : "text-[#7c5a5a] hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                <Icon size={15} className="shrink-0" />
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
