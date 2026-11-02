"use client";

import { useCallback, useEffect, useState } from "react";

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
// Switching windows back and forth shouldn't send a request each time
const MIN_REQUEST_GAP_MS = 30 * 1000;

// Whether the server is running a newer build than this tab. Checks when the
// tab comes back into view and on an interval while it's visible. Dismissing
// only lasts until the next of those, so a stale tab keeps being reminded.
// A failed check is ignored, since the server may be restarting for a deploy.
export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!CLIENT_VERSION) return;

    let isStale = false;
    let lastRequestAt = 0;

    const check = async () => {
      if (document.visibilityState !== "visible") return;

      if (isStale) {
        setAvailable(true);
        return;
      }

      if (Date.now() - lastRequestAt < MIN_REQUEST_GAP_MS) return;
      lastRequestAt = Date.now();

      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json();
        if (version && version !== CLIENT_VERSION) {
          isStale = true;
          setAvailable(true);
        }
      } catch {
        // Try again at the next check
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  const dismiss = useCallback(() => setAvailable(false), []);

  return { available, dismiss };
}
