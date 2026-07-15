"use client";

import { useEffect, useRef } from "react";
import { SessionPayload } from "@/lib/session";

// Type definition for the BroadcastChannel message payload
interface AuthChannelMessage {
  action: "LOGOUT" | "LOGIN";
  email?: string;
}

export function useAuthSync(user: SessionPayload) {
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
        // Another tab logged out, immediately redirect
        window.location.href = "/login";
      } else if (action === "LOGIN" && email !== localUserEmail) {
        // Another tab logged in as a different user - reload window
        window.location.reload();
      }
    };

    authChannel.addEventListener("message", handleCrossTabMessage);

    // Cleanup listeners on unmount
    return () => {
      authChannel.removeEventListener("message", handleCrossTabMessage);
      authChannel.close();
    };
  }, [user]);
}
