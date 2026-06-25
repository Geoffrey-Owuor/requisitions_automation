"use client";

import { createContext, useContext, useEffect } from "react";
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
  // --- CACHE USER FOR QUICK SIGN-IN ---
  useEffect(() => {
    if (user.username && user.email) {
      localStorage.setItem(
        "Requisitions_Automation_lastUser",
        JSON.stringify({ name: user.username, email: user.email }),
      );
    }
  }, [user]);

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
