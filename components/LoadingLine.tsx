"use client";

import { useLoadingStore } from "@/store/useLoadingStore";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Only show the line for navigations that take a moment, so prefetched routes
// don't flash it.
const SHOW_DELAY_MS = 150;
// Fill to 100%, then fade out.
const FILL_MS = 200;
const FADE_MS = 200;
// Recover if a navigation never lands on a new path (network error, redirect
// back to the current page).
const GIVE_UP_MS = 15_000;

const LoadingLine = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const navigating = useLoadingStore((state) => state.navigating);
  const finishNavigation = useLoadingStore((state) => state.finishNavigation);

  // 1. The navigation has landed once the path changes
  useEffect(() => {
    finishNavigation();
  }, [pathname, finishNavigation]);

  // 2. While navigating: appear after the delay, then trickle towards 95%
  useEffect(() => {
    if (!navigating) return;

    let interval: NodeJS.Timeout | undefined;

    const show = setTimeout(() => {
      // Jump start to 10% so the user sees something happened
      setProgress(10);
      setVisible(true);

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
    }, SHOW_DELAY_MS);

    const giveUp = setTimeout(finishNavigation, GIVE_UP_MS);

    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
      clearInterval(interval);
    };
  }, [navigating, finishNavigation]);

  // 3. Once finished: let the fill and fade play, then unmount
  const finishing = visible && !navigating;

  useEffect(() => {
    if (!finishing) return;

    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, FILL_MS + FADE_MS);

    return () => clearTimeout(hide);
  }, [finishing]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-100 h-[2.5px] w-full bg-transparent"
    >
      <div
        className="h-full bg-linear-to-r from-rose-500 via-rose-600 to-rose-700"
        style={{
          width: `${finishing ? 100 : progress}%`,
          opacity: finishing ? 0 : 1,
          transition: finishing
            ? `width ${FILL_MS}ms ease-out, opacity ${FADE_MS}ms ease-out ${FILL_MS}ms`
            : "width 300ms ease-out",
        }}
      />
    </div>
  );
};

export default LoadingLine;
