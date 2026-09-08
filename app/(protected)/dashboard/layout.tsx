// app/(protected)/layout.tsx
import { getSession } from "@/lib/session"; // Updated import
import { UserProvider } from "@/context/UserContext";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { getApproverMemberships } from "@/serverActions/GetApproverMemberships";
import HardRedirect from "@/components/HardRedirect";
import UserSessionWrapper from "@/components/Dashboard/UserSessionWrapper";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve the decoded jose JWT session data
  const session = await getSession();

  // If no session exists, block access and redirect to the public login page
  if (!session) {
    return <HardRedirect url="/api/auth/login" />;
  }

  // Get the possible user roles assigned to the user, and which array-based
  // approval stages (Security/IT/Director/Retail Director/HR) they belong to
  const [roles, memberships] = await Promise.all([
    getUserRoles(session.email),
    getApproverMemberships(),
  ]);

  // Construct user object properties mapped directly out of our session schema
  const userObject = {
    roles: roles,
    username: session.name,
    email: session.email,
    memberships,
  };

  // User object for running auth sync
  const sessionObject = {
    name: session.name,
    email: session.email,
  };

  return (
    <UserProvider user={userObject}>
      <UserSessionWrapper user={sessionObject}>
        <DashboardWrapper>{children}</DashboardWrapper>
      </UserSessionWrapper>
    </UserProvider>
  );
}
