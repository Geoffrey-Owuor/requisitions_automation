// app/(protected)/layout.tsx
import { getSession } from "@/lib/session"; // Updated import
import { redirect } from "next/navigation";
import AuthenticatedShell from "@/components/Dashboard/AuthenticatedShell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve the decoded jose JWT session data
  const session = await getSession();

  // If no session exists, block access and redirect to the public login page
  if (!session) {
    redirect("/login");
  }

  return <AuthenticatedShell session={session}>{children}</AuthenticatedShell>;
}
