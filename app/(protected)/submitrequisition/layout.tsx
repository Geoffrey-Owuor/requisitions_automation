// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/SessionProvider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If no session exists, redirect to the public login page
  if (!session) {
    redirect("/login");
  }

  return <AuthProvider>{children}</AuthProvider>;
}
