import { SessionPayload } from "@/lib/session";
import { UserProvider } from "@/context/UserContext";
import DashboardWrapper from "./DashboardWrapper";
import UserSessionWrapper from "./UserSessionWrapper";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { getApproverMemberships } from "@/serverActions/GetApproverMemberships";

// The signed-in dashboard shell (sidebar, header, requisition form modals),
// driven by the real session - shared by the dashboard layout and the
// approval pages, so the forms always show the identity the submission
// routes will record.
const AuthenticatedShell = async ({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) => {
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
};

export default AuthenticatedShell;
