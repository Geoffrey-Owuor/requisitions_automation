"use client";

import { createContext, useContext } from "react";
import { Roles } from "@/serverActions/GetUserRoles";
import {
  ApproverMemberships,
  EMPTY_MEMBERSHIPS,
} from "@/lib/approverMemberships";

interface UserDetails {
  roles: Roles;
  username: string;
  email: string;
  memberships: ApproverMemberships;
}

type UserProviderProps = {
  // memberships is optional here so the (approvers)/*/[uuid] pages — which
  // build their own per-stage UserProvider unrelated to array membership —
  // don't need to supply it; it falls back to all-false/empty.
  user: Omit<UserDetails, "memberships"> & {
    memberships?: ApproverMemberships;
  };
  children: React.ReactNode;
};

const UserContext = createContext<UserDetails | null>(null);

export const UserProvider = ({ user, children }: UserProviderProps) => {
  const value: UserDetails = {
    roles: user.roles,
    username: user.username,
    email: user.email,
    memberships: user.memberships ?? EMPTY_MEMBERSHIPS,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook
export const useUser = () => {
  const context = useContext(UserContext);

  // Throw error if used outside provider to ensure type safety
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
