// app/(protected)/layout.tsx
import { getSession } from "@/lib/session"; // Updated import
import { redirect } from "next/navigation";
import { UserProvider } from "@/context/UserContext";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import { getUserRoles } from "@/serverActions/GetUserRoles";

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

  // Get the possible user roles assigned to the user
  const roles = await getUserRoles(session.email);

  // Construct user object properties mapped directly out of our session schema
  const userObject = {
    roles: roles,
    username: session.name,
    email: session.email,
  };

  return (
    <UserProvider user={userObject}>
      <DashboardWrapper>{children}</DashboardWrapper>
    </UserProvider>
  );
}
