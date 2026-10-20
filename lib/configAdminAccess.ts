import "server-only";
import { PoolClient } from "pg";
import { updateTag } from "next/cache";
import { pool } from "@/lib/db";
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

export type ConfigActionResult = { ok: boolean; message: string };

// A message for the admin, as opposed to an unexpected failure
export class ConfigInputError extends Error {}

const MAX_NAME_LENGTH = 100;

// A trimmed, non-empty name of at most 100 characters
export function cleanConfigName(value: unknown, label: string): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new ConfigInputError(`Enter a ${label} name`);
  if (name.length > MAX_NAME_LENGTH) {
    throw new ConfigInputError(
      `A ${label} name cannot be longer than ${MAX_NAME_LENGTH} characters`,
    );
  }
  return name;
}

// Today's date in Africa/Nairobi, for SQL comparing effective-from dates
export const NAIROBI_TODAY_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date`;

export const isConfigId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A trimmed, lowercase email address - every email the app stores is
// lowercase (migration 020)
export function cleanConfigEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    throw new ConfigInputError("Enter a valid email address");
  }
  return email;
}

// A config_changes row as the Settings tabs list it (ChangesCard)
export type ConfigChangeRow = {
  id: string;
  summary: string;
  changedByName: string;
  changedAt: string;
};

// The last 30 Settings changes to any of `tables`
export async function loadConfigChanges(tables: string[]) {
  const { rows } = await pool.query<ConfigChangeRow>(
    `SELECT id::text, summary, changed_by_name AS "changedByName",
     TO_CHAR(changed_at AT TIME ZONE 'Africa/Nairobi', 'DD Mon YYYY, HH24:MI') AS "changedAt"
     FROM config_changes WHERE table_name = ANY($1::text[])
     ORDER BY changed_at DESC, id DESC LIMIT 30`,
    [tables],
  );
  return rows;
}

// Runs a Settings change for a config admin: one transaction for the change
// and its config_changes row, then expires `tag` (updateTag - so only from
// a server action) so the forms load the change; null for data that isn't
// cached (e.g. roles, read on every request). ConfigInputError messages
// go back to the admin; anything else is logged and reported generically.
export async function runConfigChange(
  tag: string | null,
  work: (client: PoolClient, actor: SessionPayload) => Promise<string>,
): Promise<ConfigActionResult> {
  const actor = await getConfigAdminSession();
  if (!actor) {
    return {
      ok: false,
      message: "You are not authorized to change the settings",
    };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const message = await work(client, actor);
    await client.query("COMMIT");
    if (tag) updateTag(tag);
    return { ok: true, message };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof ConfigInputError) {
      return { ok: false, message: error.message };
    }
    if ((error as { code?: string }).code === "23505") {
      // Logged so a collision that isn't a real duplicate (e.g. a primary
      // key sequence behind the table) shows which constraint fired
      console.warn(
        `Unique violation while changing the settings (${tag}):`,
        (error as { constraint?: string }).constraint,
      );
      return { ok: false, message: "That already exists" };
    }
    console.error(`Error while changing the settings (${tag}):`, error);
    return {
      ok: false,
      message: "The change could not be saved, please try again",
    };
  } finally {
    client.release();
  }
}
