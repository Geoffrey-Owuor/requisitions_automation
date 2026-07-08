"use client";

import Image from "next/image";
import { assets } from "@/public/assets";
import { useState, useEffect, useRef } from "react";
import {
  Cloud,
  Grip,
  LaptopMinimalCheck,
  Mail,
  ShoppingBag,
  UsersRound,
} from "lucide-react";

const launcherApps = [
  {
    name: "Purchase",
    icon: ShoppingBag,
    href: "https://192.168.0.155:4443/login",
  },
  {
    name: "Desk",
    icon: LaptopMinimalCheck,
    href: "https://192.168.0.155:8443/login",
  },
  { name: "Outlook", icon: Mail, href: "https://outlook.cloud.microsoft" },
  {
    name: "OneDrive",
    icon: Cloud,
    href: "https://hotpointkenya-my.sharepoint.com/",
  },
  { name: "Teams", icon: UsersRound, href: "https://teams.cloud.microsoft" },
];

// TODO: Ensure your assets.hotpoint_logo points to a valid image path
const DashboardBrand = ({ showText = false }: { showText?: boolean }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  //UseEffect to handle clicking outside the button element
  useEffect(() => {
    // 2. Define the event handler
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click happened outside the container element
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(false);
      }
    };

    // 3. Add the event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // 4. The Cleanup Function: Remove the listener when the component unmounts
    // or before the effect runs again
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setOpenMenu((prev) => !prev)}
      className="relative flex cursor-pointer items-center gap-1.5 rounded-full p-2 hover:bg-white/10"
    >
      <div className="relative inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center">
        {isHovered ? (
          <Grip className="h-6 w-6 text-white" />
        ) : (
          <Image
            src={assets.hotpoint_black_logo}
            alt="IssueDesk Logo"
            sizes="32px"
            loading="eager"
            className="object-contain invert"
            fill // Added fill to fit safely inside the absolute container
            priority
          />
        )}
      </div>
      {showText && (
        <div className="flex flex-col gap-px leading-none">
          <span className="text-[14px] font-semibold text-[#1e1b1b]">
            Requisition Hub
          </span>
          <span className="text-[11px] text-[#a18080]">
            Hotpoint Appliances Ltd
          </span>
        </div>
      )}

      {openMenu && <AppMenu />}
    </button>
  );
};

// App Menu Launcher - position should be fixed just below the logo icon

const AppMenu = () => {
  return (
    <div className="absolute top-12 left-0 z-50 max-h-100 w-80 overflow-y-auto rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {/* Container holding the grid */}
      <div className="relative z-10 grid grid-cols-3 gap-2">
        {launcherApps.map((app) => {
          const Icon = app.icon;
          return (
            <a
              key={app.name}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center rounded-2xl p-3 transition-all duration-300 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              {/* Icon Container with subtle border, shadow, and lift on hover */}
              <div className="mb-2 flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-gray-500 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-red-100 group-hover:text-red-600 group-hover:shadow-md">
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>

              {/* App Label with enhanced contrast on hover */}
              <span className="text-xs font-medium tracking-wide text-gray-500 transition-colors duration-300 group-hover:text-gray-900">
                {app.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardBrand;
