"use server";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { CONFIG_ADMIN_ROLE } from "@/lib/configAdmin";
import {
  cleanConfigEmail,
  cleanConfigName,
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  isConfigId,
  loadConfigChanges,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Users & Roles tab. Users are recorded at sign-in
// (lib/users.ts) or added here ahead of it. Roles are a fixed set the code
// checks by name (config-admin, hr-advance, reports-*), so they are only
// assigned, removed and described here - never created or renamed. Approver
// access isn't a role: it comes from the approver arrays (Approvers tab).
// Roles aren't cached - every request reads them - so no tag is expired.

const USER_TABLES = ["users", "user_roles", "roles"];

export interface UserRoleAdminData {
  users: {
    id: number;
    email: string;
    name: string;
    lastSignIn: string | null;
    roleIds: number[];
  }[];
  roles: {
    id: number;
    name: string;
    description: string;
    holders: number;
  }[];
  changes: ConfigChangeRow[];
  // The viewer, so the tab can disable removing their own config-admin role
  viewerEmail: string;
}

export async function getUserRoleAdminData(): Promise<UserRoleAdminData | null> {
  const session = await getConfigAdminSession();
  if (!session) return null;

  const [users, roles, changes] = await Promise.all([
    query<UserRoleAdminData["users"][number]>(
      `SELECT u.user_id AS id, u.email, u.username AS name,
       TO_CHAR(u.last_sign_in_at AT TIME ZONE 'Africa/Nairobi', 'DD Mon YYYY, HH24:MI') AS "lastSignIn",
       COALESCE(ARRAY_AGG(ur.role_id ORDER BY ur.role_id)
         FILTER (WHERE ur.role_id IS NOT NULL), '{}') AS "roleIds"
       FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       GROUP BY u.user_id ORDER BY LOWER(u.username), u.email`,
    ),
    query<UserRoleAdminData["roles"][number]>(
      `SELECT r.role_id AS id, r.role_name AS name, r.description,
       COUNT(ur.user_id)::int AS holders
       FROM roles r LEFT JOIN user_roles ur ON ur.role_id = r.role_id
       GROUP BY r.role_id ORDER BY r.role_name`,
    ),
    loadConfigChanges(USER_TABLES),
  ]);

  return { users, roles, changes, viewerEmail: session.email };
}

export async function addUser(email: unknown, name: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const userEmail = cleanConfigEmail(email);
    const userName = cleanConfigName(name, "user");

    const { rows } = await client.query(
      `INSERT INTO users (email, username) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING user_id, email, username`,
      [userEmail, userName],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(`${userEmail} is already a user`);
    }

    await recordConfigChange(client, actor, {
      table: "users",
      key: rows[0].user_id,
      action: "create",
      summary: `Added user ${userName} (${userEmail})`,
      after: rows[0],
    });
    return `Added ${userName}`;
  });
}

// The user and role a role change is about, or a ConfigInputError
async function loadUserAndRole(
  client: PoolClient,
  userId: unknown,
  roleId: unknown,
) {
  if (!isConfigId(userId) || !isConfigId(roleId)) {
    throw new ConfigInputError("Choose a user and a role");
  }
  const [user, role] = await Promise.all([
    client.query(
      `SELECT user_id, email, username FROM users WHERE user_id = $1`,
      [userId],
    ),
    client.query(`SELECT role_id, role_name FROM roles WHERE role_id = $1`, [
      roleId,
    ]),
  ]);
  if (user.rows.length === 0 || role.rows.length === 0) {
    throw new ConfigInputError(
      "That user or role no longer exists - reload to see the latest",
    );
  }
  return {
    user: user.rows[0] as { user_id: number; email: string; username: string },
    role: role.rows[0] as { role_id: number; role_name: string },
  };
}

export async function assignRole(userId: unknown, roleId: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const { user, role } = await loadUserAndRole(client, userId, roleId);

    const { rowCount } = await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user.user_id, role.role_id],
    );
    if (rowCount === 0) {
      throw new ConfigInputError(
        `${user.username} already has ${role.role_name}`,
      );
    }

    const summary = `Gave ${user.username} (${user.email}) the ${role.role_name} role`;
    await recordConfigChange(client, actor, {
      table: "user_roles",
      key: `${user.user_id}:${role.role_id}`,
      action: "create",
      summary,
      after: { email: user.email, role: role.role_name },
    });
    return summary;
  });
}

export async function removeRole(userId: unknown, roleId: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const { user, role } = await loadUserAndRole(client, userId, roleId);

    // Settings must always keep someone who can manage it: no removing your
    // own config-admin role, nor the last one. The holders are locked so two
    // admins removing each other at once can't both pass the check.
    if (role.role_name === CONFIG_ADMIN_ROLE) {
      if (user.email === actor.email) {
        throw new ConfigInputError(
          `You can't remove your own ${CONFIG_ADMIN_ROLE} role - ask another config admin`,
        );
      }
      const holders = await client.query(
        `SELECT user_id FROM user_roles WHERE role_id = $1 FOR UPDATE`,
        [role.role_id],
      );
      if (holders.rows.length <= 1) {
        throw new ConfigInputError(
          `${user.username} is the last ${CONFIG_ADMIN_ROLE} and can't be removed`,
        );
      }
    }

    const { rowCount } = await client.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [user.user_id, role.role_id],
    );
    if (rowCount === 0) {
      throw new ConfigInputError(
        `${user.username} no longer has ${role.role_name} - reload to see the latest`,
      );
    }

    const summary = `Removed the ${role.role_name} role from ${user.username} (${user.email})`;
    await recordConfigChange(client, actor, {
      table: "user_roles",
      key: `${user.user_id}:${role.role_id}`,
      action: "delete",
      summary,
      before: { email: user.email, role: role.role_name },
    });
    return summary;
  });
}

export async function setRoleDescription(
  roleId: unknown,
  description: unknown,
) {
  return runConfigChange(null, async (client, actor) => {
    if (!isConfigId(roleId)) throw new ConfigInputError("Choose a role");
    const text = typeof description === "string" ? description.trim() : "";
    if (!text) throw new ConfigInputError("Enter a description");
    if (text.length > 200) {
      throw new ConfigInputError(
        "A description cannot be longer than 200 characters",
      );
    }

    const { rows } = await client.query(
      `UPDATE roles r SET description = $2
       FROM roles old WHERE r.role_id = $1 AND old.role_id = r.role_id
       RETURNING r.role_name, old.description AS before`,
      [roleId, text],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "That role no longer exists - reload to see the latest",
      );
    }

    const summary = `Changed the description of the ${rows[0].role_name} role`;
    await recordConfigChange(client, actor, {
      table: "roles",
      key: roleId,
      action: "update",
      summary,
      before: { description: rows[0].before },
      after: { description: text },
    });
    return summary;
  });
}
