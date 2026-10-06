import "server-only";
import { getSession, type SessionPayload } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";

export const HR_ADVANCE_ROLE = "hr-advance";

// The session of a salary advance HR reviewer, or null for anyone else. The
// dashboard only shows the HR view to this role, but server actions and API
// routes are directly callable, so every HR-side read, review and export
// checks it again here.
export async function getHrAdvanceSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const roles = await getUserRoles(session.email);
  return roles.includes(HR_ADVANCE_ROLE) ? session : null;
}
