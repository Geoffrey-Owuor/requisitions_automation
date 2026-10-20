"use server";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { CONFIG_ADMIN_ROLE } from "@/lib/configAdmin";
import { APPROVER_STAGES } from "@/lib/approverStages";
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
// Users are deactivated rather than deleted (migration 031): a deactivated
// user can't sign in and their sessions stop working (lib/session.ts).

const USER_TABLES = ["users", "user_roles", "roles"];

export interface UserRoleAdminData {
  users: {
    id: number;
    email: string;
    name: string;
    lastSignIn: string | null;
    roleIds: number[];
    // Null while the account is active
    deactivation: {
      at: string;
      byEmail: string | null;
      reason: string | null;
    } | null;
  }[];
  roles: {
    id: number;
    name: string;
    description: string;
    // Active holders only
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
         FILTER (WHERE ur.role_id IS NOT NULL), '{}') AS "roleIds",
       CASE WHEN u.deactivated_at IS NOT NULL THEN JSON_BUILD_OBJECT(
         'at', TO_CHAR(u.deactivated_at AT TIME ZONE 'Africa/Nairobi', 'DD Mon YYYY, HH24:MI'),
         'byEmail', u.deactivated_by,
         'reason', u.deactivation_reason) END AS deactivation
       FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       GROUP BY u.user_id ORDER BY LOWER(u.username), u.email`,
    ),
    query<UserRoleAdminData["roles"][number]>(
      `SELECT r.role_id AS id, r.role_name AS name, r.description,
       COUNT(u.user_id)::int AS holders
       FROM roles r LEFT JOIN user_roles ur ON ur.role_id = r.role_id
       LEFT JOIN users u ON u.user_id = ur.user_id AND u.deactivated_at IS NULL
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
    // own config-admin role, nor the last active one's.
    if (role.role_name === CONFIG_ADMIN_ROLE) {
      if (user.email === actor.email) {
        throw new ConfigInputError(
          `You can't remove your own ${CONFIG_ADMIN_ROLE} role - ask another config admin`,
        );
      }
      if ((await otherActiveConfigAdmins(client, user.user_id)) === 0) {
        throw new ConfigInputError(
          `${user.username} is the last active ${CONFIG_ADMIN_ROLE} and can't lose the role`,
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

// How many active config admins there are besides `userId`. Every holder's
// user_roles row is locked first, so two admins removing or deactivating each
// other at once can't both pass; the count is a separate statement so it sees
// what the transaction that held the lock committed.
async function otherActiveConfigAdmins(client: PoolClient, userId: number) {
  await client.query(
    `SELECT ur.user_id FROM user_roles ur
     WHERE ur.role_id = (SELECT role_id FROM roles WHERE role_name = $1)
     FOR UPDATE`,
    [CONFIG_ADMIN_ROLE],
  );
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id
     JOIN users u ON u.user_id = ur.user_id
     WHERE r.role_name = $1 AND u.deactivated_at IS NULL AND u.user_id <> $2`,
    [CONFIG_ADMIN_ROLE, userId],
  );
  return rows[0].count as number;
}

// The user a (de)activation is about, locked, or a ConfigInputError
async function lockUser(client: PoolClient, userId: unknown) {
  if (!isConfigId(userId)) throw new ConfigInputError("Choose a user");
  const { rows } = await client.query(
    `SELECT user_id, email, username, deactivated_at IS NOT NULL AS deactivated,
     deactivated_by, deactivation_reason
     FROM users WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  if (rows.length === 0) {
    throw new ConfigInputError(
      "That user no longer exists - reload to see the latest",
    );
  }
  return rows[0] as {
    user_id: number;
    email: string;
    username: string;
    deactivated: boolean;
    deactivated_by: string | null;
    deactivation_reason: string | null;
  };
}

export async function deactivateUser(userId: unknown, reason: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const user = await lockUser(client, userId);
    if (user.deactivated) {
      throw new ConfigInputError(`${user.username} is already deactivated`);
    }
    if (user.email === actor.email) {
      throw new ConfigInputError(
        "You can't deactivate your own account - ask another config admin",
      );
    }
    const text = typeof reason === "string" ? reason.trim() : "";
    if (text.length > 500) {
      throw new ConfigInputError(
        "A reason cannot be longer than 500 characters",
      );
    }

    // Approval links work without signing in, so an approver must be removed
    // on the Approvers tab first - where removing one that would strand
    // pending work is refused. addApprover refuses deactivated users under a
    // share lock on this row, so neither can slip past the other.
    const { rows: stages } = await client.query<{ stage: string }>(
      APPROVER_STAGES.map(
        ({ key }) =>
          `SELECT '${key}' AS stage FROM ${key}_array WHERE ${key}_email = $1`,
      ).join(" UNION "),
      [user.email],
    );
    if (stages.length > 0) {
      const labels = APPROVER_STAGES.filter(({ key }) =>
        stages.some((row) => row.stage === key),
      ).map(({ label }) => label);
      throw new ConfigInputError(
        `${user.username} is still an approver (${labels.join(", ")}) - remove them on the Approvers tab first, since approval links work without signing in`,
      );
    }

    const isConfigAdmin = await client.query(
      `SELECT 1 FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1 AND r.role_name = $2`,
      [user.user_id, CONFIG_ADMIN_ROLE],
    );
    if (
      isConfigAdmin.rows.length > 0 &&
      (await otherActiveConfigAdmins(client, user.user_id)) === 0
    ) {
      throw new ConfigInputError(
        `${user.username} is the last active ${CONFIG_ADMIN_ROLE} and can't be deactivated`,
      );
    }

    await client.query(
      `UPDATE users SET deactivated_at = NOW(), deactivated_by = $2,
       deactivation_reason = $3 WHERE user_id = $1`,
      [user.user_id, actor.email, text || null],
    );

    const summary = `Deactivated ${user.username} (${user.email})`;
    await recordConfigChange(client, actor, {
      table: "users",
      key: user.user_id,
      action: "update",
      summary,
      before: { email: user.email, active: true },
      after: { email: user.email, active: false, reason: text || null },
    });
    return summary;
  });
}

export async function reactivateUser(userId: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const user = await lockUser(client, userId);
    if (!user.deactivated) {
      throw new ConfigInputError(`${user.username} is already active`);
    }

    await client.query(
      `UPDATE users SET deactivated_at = NULL, deactivated_by = NULL,
       deactivation_reason = NULL WHERE user_id = $1`,
      [user.user_id],
    );

    const summary = `Reactivated ${user.username} (${user.email})`;
    await recordConfigChange(client, actor, {
      table: "users",
      key: user.user_id,
      action: "update",
      summary,
      before: {
        email: user.email,
        active: false,
        deactivatedBy: user.deactivated_by,
        reason: user.deactivation_reason,
      },
      after: { email: user.email, active: true },
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
