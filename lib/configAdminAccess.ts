import "server-only";
import { PoolClient } from "pg";
import { getSession, type SessionPayload } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { CONFIG_ADMIN_ROLE } from "@/lib/configAdmin";

// The session of a config admin, or null for anyone else. The Settings page
// and nav only show to this role, but server actions are directly callable,
// so every Settings read and write checks it again here.
export async function getConfigAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const roles = await getUserRoles(session.email);
  return roles.includes(CONFIG_ADMIN_ROLE) ? session : null;
}

// Records a Settings change in config_changes (migration 026). Call inside
// the transaction that makes the change, so a change is never unrecorded.
export async function recordConfigChange(
  client: Pick<PoolClient, "query">,
  actor: SessionPayload,
  change: {
    table: string;
    key: string | number;
    action: "create" | "update" | "delete";
    summary: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await client.query(
    `INSERT INTO config_changes
     (table_name, record_key, action, summary, before_data, after_data,
      changed_by_email, changed_by_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      change.table,
      String(change.key),
      change.action,
      change.summary,
      change.before === undefined ? null : JSON.stringify(change.before),
      change.after === undefined ? null : JSON.stringify(change.after),
      actor.email,
      actor.name,
    ],
  );
}
