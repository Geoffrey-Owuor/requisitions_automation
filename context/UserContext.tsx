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
  // memberships is optional; it falls back to all-false/empty. Every
  // provider is built from the session (components/Dashboard/AuthenticatedShell)
  // - the (approvers) pages no longer build one from the approval token.
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

// True under a UserProvider. Every provider is built from the session, so this
// means the viewer is signed in - without throwing when they aren't (e.g. the
// approval pages' status screens, which render for visitors too).
export const useIsSignedIn = () => useContext(UserContext) !== null;

// Custom hook
export const useUser = () => {
  const context = useContext(UserContext);

  // Throw error if used outside provider to ensure type safety
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
