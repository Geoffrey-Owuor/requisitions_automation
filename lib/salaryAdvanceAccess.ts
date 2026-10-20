import "server-only";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import {
  ConfigInputError,
  type ConfigActionResult,
} from "@/lib/configAdminAccess";
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

// Runs an HR-side change for an hr-advance holder in one transaction, the
// salary advance counterpart of runConfigChange (lib/configAdminAccess.ts):
// ConfigInputError messages go back to HR, anything else is logged and
// reported generically. `work` returns the success message.
export async function runHrAdvanceChange(
  label: string,
  work: (client: PoolClient, actor: SessionPayload) => Promise<string>,
): Promise<ConfigActionResult> {
  const actor = await getHrAdvanceSession();
  if (!actor) {
    return { ok: false, message: "You are not authorized to do this" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const message = await work(client, actor);
    await client.query("COMMIT");
    return { ok: true, message };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof ConfigInputError) {
      return { ok: false, message: error.message };
    }
    console.error(`Error while ${label}:`, error);
    return {
      ok: false,
      message: "The change could not be saved, please try again",
    };
  } finally {
    client.release();
  }
}
