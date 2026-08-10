"use client";

import { useLoadingStore } from "@/store/useLoadingStore";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LoadingLine = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  // Loading store data
  const loadingLine = useLoadingStore((state) => state.loadingLine);
  const setLoadingLine = useLoadingStore((state) => state.setLoadingLine);

  // 1. Reset on route change
  useEffect(() => {
    setLoadingLine(false);
    Promise.resolve().then(() => setProgress(0));
  }, [pathname, setLoadingLine]);

  // 2. Handle the progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loadingLine) {
      // Jump start to 10% immediately so user sees something happened
      Promise.resolve().then(() => setProgress(10));

      interval = setInterval(() => {
        setProgress((prev) => {
          // If we reached our cap, stop incrementing
          if (prev >= 95) {
            return 95;
          }

          // "Decay" formula: The closer we get to 95, the smaller the jump.
          // This simulates a "loading..." feeling without hitting 100% prematurely.
          const remaining = 95 - prev;
          const jump = Math.max(0.5, remaining * 0.05); // Move 5% of the remaining distance (Zeno breaker, if jump is less than 0.5 then move at 0.5 intervals of the remaining instead - When it reaches 85)

          return prev + jump;
        });
      }, 100); // Update every 100ms
    } else {
      Promise.resolve().then(() => setProgress(0));
    }

    return () => clearInterval(interval);
  }, [loadingLine]);

  // If not loading, render nothing
  if (!loadingLine) return null;

  return (
    <div className="fixed top-0 left-0 z-100 h-[2.5px] w-full bg-transparent">
      <div
        className="h-full bg-linear-to-r from-rose-500 via-rose-600 to-rose-700 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default LoadingLine;
