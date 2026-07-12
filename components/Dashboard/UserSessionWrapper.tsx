"use client";
import { useAuthSync } from "@/hooks/useAuthSync";
import { SessionPayload } from "@/lib/session";

const UserSessionWrapper = ({
  user,
  children,
}: {
  children: React.ReactNode;
  user: SessionPayload;
}) => {
  useAuthSync(user);
  return <>{children}</>;
};

export default UserSessionWrapper;
