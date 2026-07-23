"use client";

import Image from "next/image";
import { assets, BASE_URL } from "@/public/assets";
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
    href: `${BASE_URL}/staffproductpurchase/login`,
  },
  {
    name: "HelpDesk",
    icon: LaptopMinimalCheck,
    href: `${BASE_URL}/helpdesk/login`,
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
            Apps Hub
          </span>
          <span className="text-[11px] text-[#a18080]">
            Hotpoint Appliances
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
    <div className="absolute top-12 left-0 z-50 w-88 overflow-hidden rounded-[28px] border border-gray-100/80 bg-white/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all">
      {/* Grid Container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-200 max-h-80 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-2">
          {launcherApps.map((app) => {
            const Icon = app.icon;
            return (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center rounded-2xl p-2.5 transition-all duration-200 hover:bg-red-50/60 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:outline-none active:scale-95"
              >
                {/* Icon Tile */}
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50/80 text-gray-600 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:bg-white group-hover:text-red-600 group-hover:shadow-md group-hover:ring-red-100">
                  <Icon
                    className="h-6 w-6 transition-transform duration-200 group-hover:scale-105"
                    strokeWidth={1.75}
                  />
                </div>

                {/* App Label */}
                <span className="max-w-full truncate text-[11px] font-semibold text-gray-600 transition-colors duration-200 group-hover:text-gray-900">
                  {app.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardBrand;
