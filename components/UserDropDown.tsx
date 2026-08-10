// components/UserDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { initialsHelper } from "@/public/assets";
import RolePill from "./RolePill";
import LogoutOverlay from "./Modules/LogoutOverlay";

type UserDropdownProps = {
  direction: "up" | "down";
};

export default function UserDropdown({
  direction = "down",
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showOverlay, setShowOverlay] = useState(false);

  // User details
  // roles here is an array of unique strings
  const { username, email, roles } = useUser();

  // Initials
  const initials = initialsHelper(username);

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

  const positionClasses =
    direction === "up"
      ? "bottom-full mb-3 left-0 origin-bottom-left"
      : "top-full mt-3 right-0 origin-top-right";

  const handleLogout = async () => {
    setShowOverlay(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok)
        throw new Error("Error occurred while trying to logout");

      // Notify other tabs to redirect to homepage
      const authChannel = new BroadcastChannel("auth_session_sync");
      authChannel.postMessage({ action: "LOGOUT" });
      authChannel.close();

      window.location.href = "/login";
    } catch (error) {
      console.error("Error while trying to log out:", error);
      setShowOverlay(false);
    }
  };

  return (
    <>
      {showOverlay && <LogoutOverlay />}
      <div className="relative z-50 inline-block text-left" ref={dropdownRef}>
        {/* ── TRIGGER BUTTON ── */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-50 to-rose-100 text-[11px] font-semibold text-red-950 hover:shadow-sm active:scale-95 md:h-8 md:w-8"
          aria-expanded={isOpen}
        >
          {initials || "NA"}
        </button>

        {/* ── DROPDOWN MENU ── */}
        {isOpen && (
          <div
            className={`absolute ${positionClasses} w-60 rounded-2xl bg-white p-2 shadow-2xl duration-200`}
          >
            {/* User Info Header */}

            <div className="mb-1 flex flex-col gap-0.5 rounded-xl bg-slate-100/70 px-4 py-3">
              <span className="truncate text-[14px] font-semibold text-slate-900">
                {username}
              </span>
              <span className="truncate border-b border-slate-200 pb-2 text-[12px] font-medium text-slate-500">
                {email}
              </span>

              <span className="mt-3 text-xs font-medium text-neutral-700">
                Active roles:
              </span>

              {/* TODO: Add this mapping block directly below the email span */}
              {roles && roles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <RolePill key={role} role={role} />
                  ))}
                </div>
              )}
            </div>

            {/* CHANGE: Execute the logout endpoint directly via window navigation */}
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
            >
              <LogOut
                size={16}
                className="text-slate-400 transition-colors group-hover:text-rose-500"
              />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
