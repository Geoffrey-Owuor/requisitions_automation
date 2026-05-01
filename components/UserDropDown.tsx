"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { SignOut } from "@/serverActions/SignOut";

type UserDropdownProps = {
  initials?: string;
  userName?: string | null;
  userEmail?: string | null;
};

export default function UserDropdown({
  initials,
  userName,
  userEmail,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative z-50 ml-auto inline-block text-left"
      ref={dropdownRef}
    >
      {/* ── TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 p-1 pr-3 backdrop-blur-md transition-all hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-sm active:scale-95"
        aria-expanded={isOpen}
      >
        {/* Initials Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-slate-800 to-rose-900 text-[11px] font-semibold text-white shadow-sm">
          {initials || "NA"}
        </div>

        {/* Subtle Chevron */}
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── DROPDOWN MENU ── */}
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl duration-200">
          {/* User Info Header */}
          <div className="mb-1 flex flex-col gap-0.5 rounded-xl bg-slate-50/80 px-4 py-3">
            <span className="truncate text-[14px] font-semibold text-slate-900">
              {userName || "Unknown User"}
            </span>
            <span className="truncate text-[12px] font-medium text-slate-500">
              {userEmail || "Not logged in"}
            </span>
          </div>

          <div className="my-1 h-px w-full bg-slate-100" />

          {/* Action: Sign Out Form */}
          <form action={SignOut}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
            >
              <LogOut
                size={16}
                className="text-slate-400 transition-colors group-hover:text-rose-500"
              />
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
