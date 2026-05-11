// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserProvider } from "@/context/UserContext";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";

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

  // The user object
  const userObject = {
    username: session.user?.name,
    email: session.user?.email,
  };

  return (
    <UserProvider user={userObject}>
      <DashboardWrapper>{children}</DashboardWrapper>
    </UserProvider>
  );
}
