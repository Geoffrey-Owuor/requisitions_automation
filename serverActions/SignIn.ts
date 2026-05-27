"use server";

import { signIn } from "@/lib/auth";

export const handleSignIn = async () => {
  await signIn("microsoft-entra-id", {
    redirectTo: "/dashboard",
  });
};
