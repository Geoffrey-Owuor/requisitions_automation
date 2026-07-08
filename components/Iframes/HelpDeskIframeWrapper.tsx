"use client";
import { Loader2 } from "lucide-react";
import { assets } from "@/public/assets";
import Image from "next/image";
import { useState } from "react";

const HelpDeskIframeWrapper = ({ ssoUrl }: { ssoUrl: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="relative h-full w-full bg-white dark:bg-neutral-950">
      {/* - LOADER OVERLAY - */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* Larger Shopping Bag Icon */}
          <Image
            src={assets.issue_desk_logo}
            alt="HelpDesk"
            className="h-35 w-35"
            preload
          />
          {/* Smaller Spinning Loader */}
          <Loader2 className="mt-12 h-12 w-12 animate-spin text-neutral-500 dark:text-neutral-400" />

          {/* Footer at the bottom of the loader wrapper */}
          <div className="absolute right-0 bottom-6 left-0 px-4 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} Hotpoint Appliances Ltd. Internal Use
              Only
            </p>
          </div>
        </div>
      )}

      <iframe
        src={ssoUrl} // Reverse proxy login page
        title="Hotpoint HelpDesk"
        className={`h-full w-full border-none transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        allow="clipboard-read; clipboard-write"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default HelpDeskIframeWrapper;
