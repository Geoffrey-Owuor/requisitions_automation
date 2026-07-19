"use client";
import { useAuthSync } from "@/hooks/useAuthSync";
import { SessionPayload } from "@/lib/session";
import { useEffect } from "react";

const UserSessionWrapper = ({
  user,
  children,
}: {
  children: React.ReactNode;
  user: SessionPayload;
}) => {
  // Broadcast login
  useEffect(() => {
    const authChannel = new BroadcastChannel("auth_session_sync");
    authChannel.postMessage({ action: "LOGIN", email: user.email });
    authChannel.close();
  }, [user.email]);

  useAuthSync(user);
  return <>{children}</>;
};

export default UserSessionWrapper;
