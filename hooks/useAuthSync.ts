"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionPayload } from "@/lib/session";

// Only check the server on focus if X minutes have passed since the last check
const THROTTLE_INTERVAL = 1000 * 60 * 30; // 30 minutes

// Type definition for the BroadcastChannel message payload
interface AuthChannelMessage {
  action: "LOGOUT" | "LOGIN";
  email?: string;
}

export function useAuthSync(user: SessionPayload) {
  const router = useRouter();

  // FIX 1: Initialize with null to avoid calling Date.now() during render
  const lastCheckedRef = useRef<number | null>(null);

  useEffect(() => {
    const localUserEmail = user.email;
    if (!localUserEmail) return;

    // Set the initial timestamp when the component mounts/user changes
    if (lastCheckedRef.current === null) {
      lastCheckedRef.current = Date.now();
    }

    // 1. Initialize Modern Cross-Tab communication channel
    const authChannel = new BroadcastChannel("auth_session_sync");

    // FIX 2: Explicitly typed the event parameter using MessageEvent
    const handleCrossTabMessage = async (
      event: MessageEvent<AuthChannelMessage>,
    ) => {
      const { action, email } = event.data;

      if (action === "LOGOUT") {
        // Another tab logged out, immediately clean up and redirect
        router.push("/");
        router.refresh();
      } else if (action === "LOGIN" && email !== localUserEmail) {
        // Another tab logged in as a different user (Imposter caught)
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
      }
    };

    authChannel.addEventListener("message", handleCrossTabMessage);

    // 2. Throttled server fallback (Handles absolute session expiration or logouts on other devices)
    const checkSessionFromServer = async () => {
      const now = Date.now();

      // Fallback safely if ref hasn't been set yet
      const lastChecked = lastCheckedRef.current ?? 0;
      if (now - lastChecked < THROTTLE_INTERVAL) return; // Skip if checked recently

      lastCheckedRef.current = now;

      try {
        const response = await fetch("/api/check-session");
        const data = await response.json();

        if (data.loggedIn === false) {
          router.push("/");
          router.refresh();
        } else if (data.loggedIn === true && data.email !== localUserEmail) {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    };

    window.addEventListener("focus", checkSessionFromServer);

    // Cleanup listeners on unmount
    return () => {
      authChannel.removeEventListener("message", handleCrossTabMessage);
      authChannel.close();
      window.removeEventListener("focus", checkSessionFromServer);
    };
  }, [user, router]);
}
