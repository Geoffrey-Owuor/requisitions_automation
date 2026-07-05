"use client";

import { createContext, useContext } from "react";
import { Roles } from "@/serverActions/GetUserRoles";

interface UserDetails {
  roles: Roles;
  username: string;
  email: string;
}

type UserProviderProps = {
  user: UserDetails;
  children: React.ReactNode;
};

const UserContext = createContext<UserDetails | null>(null);

export const UserProvider = ({ user, children }: UserProviderProps) => {
  const value: UserDetails = {
    roles: user.roles,
    username: user.username,
    email: user.email,
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
