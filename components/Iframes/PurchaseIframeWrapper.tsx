"use client";
import { Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";

const PurchaseIframeWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="relative h-full w-full bg-white dark:bg-gray-950">
      {/* - LOADER OVERLAY - */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* Larger Shopping Bag Icon */}
          <ShoppingBag
            className="mb-12 h-22 w-22 text-gray-800 dark:text-gray-200"
            strokeWidth={1.5}
          />
          {/* Smaller Spinning Loader */}
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />

          {/* Footer at the bottom of the loader wrapper */}
          <div className="absolute right-0 bottom-6 left-0 px-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Hotpoint Appliances Ltd. Internal Use
              Only
            </p>
          </div>
        </div>
      )}

      <iframe
        src="https://192.168.34.234:4443/login" // Reverse proxy login page
        title="Staff Product Purchase"
        className={`h-full w-full border-none transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default PurchaseIframeWrapper;
