"use server";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import type { HrForm } from "@/public/assets";
import {
  APPROVER_STAGES,
  type ApproverStageKey,
  isApproverStageKey,
  isHrFormList,
} from "@/lib/approverStages";
import {
  approverRemovalBlocker,
  hodPendingCounts,
  hrFormsChangeBlocker,
} from "@/lib/approverPendingWork";
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

// The Settings page's Approvers tab: every {stage}_array table, the HOD
// department / alternate-only flags and alternates (migrations 008, 018) and
// the HR forms (009). Each row's {stage}_uuid is its approval token: it is
// never sent to the browser nor written to config_changes - the tab can only
// regenerate it, which stops every link already emailed to that approver.
// Emails are never edited (requisitions store them); remove and re-add.
// Only the HOD list is cached (the forms' HOD dropdown, tag GetHodArray).

const NO_DEPARTMENT = "N/A";
const APPROVER_TABLES = [
  ...APPROVER_STAGES.map((stage) => `${stage.key}_array`),
  "hod_alternates",
];

export type AdminApprover = {
  id: number;
  name: string;
  email: string;
  // HOD only
  department?: string | null;
  isAlternateOnly?: boolean;
  alternateIds?: number[];
  pendingAsHod?: number;
  // HR only
  hrForms?: HrForm[];
};

export interface ApproverAdminData {
  approvers: Record<ApproverStageKey, AdminApprover[]>;
  departments: string[];
  changes: ConfigChangeRow[];
}

const tagFor = (stage: ApproverStageKey) =>
  stage === "hod" ? "GetHodArray" : null;
const stageLabel = (stage: ApproverStageKey) =>
  APPROVER_STAGES.find((entry) => entry.key === stage)!.label;

export async function getApproverAdminData(): Promise<ApproverAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  // Through the pool, not one client: a client runs one query at a time, and
  // these reads don't need a transaction
  const [lists, departments, hodPending, changes] = await Promise.all([
    Promise.all(
      APPROVER_STAGES.map(({ key }) =>
        pool.query<AdminApprover>(
          key === "hod"
            ? `SELECT h.id, h.hod_name AS name, h.hod_email AS email,
               NULLIF(h.hod_department, '${NO_DEPARTMENT}') AS department,
               h.is_alternate_only AS "isAlternateOnly",
               COALESCE(ARRAY_AGG(a.alternate_id ORDER BY a.alternate_id)
                 FILTER (WHERE a.alternate_id IS NOT NULL), '{}') AS "alternateIds"
               FROM hod_array h LEFT JOIN hod_alternates a ON a.hod_id = h.id
               GROUP BY h.id ORDER BY LOWER(h.hod_name)`
            : `SELECT id, ${key}_name AS name, ${key}_email AS email
               ${key === "hr" ? `, hr_forms AS "hrForms"` : ""}
               FROM ${key}_array ORDER BY LOWER(${key}_name)`,
        ),
      ),
    ),
    pool.query<{ name: string }>(
      `SELECT department_name AS name FROM base_departments
       WHERE is_active ORDER BY department_name`,
    ),
    hodPendingCounts(pool),
    loadConfigChanges(APPROVER_TABLES),
  ]);

  const approvers = Object.fromEntries(
    APPROVER_STAGES.map(({ key }, index) => [
      key,
      key === "hod"
        ? lists[index].rows.map((row) => ({
            ...row,
            pendingAsHod: hodPending.get(row.email) ?? 0,
          }))
        : lists[index].rows,
    ]),
  ) as Record<ApproverStageKey, AdminApprover[]>;

  return {
    approvers,
    departments: departments.rows.map((row) => row.name),
    changes,
  };
}

// The approver `id` of `stage`, locked, or a ConfigInputError
async function loadApprover(
  client: PoolClient,
  stage: ApproverStageKey,
  id: unknown,
) {
  if (!isConfigId(id)) throw new ConfigInputError("Choose an approver");
  const { rows } = await client.query(
    `SELECT id, ${stage}_name AS name, ${stage}_email AS email
     ${stage === "hr" ? `, hr_forms AS "hrForms"` : ""}
     ${stage === "hod" ? `, hod_department AS department, is_alternate_only AS "isAlternateOnly"` : ""}
     FROM ${stage}_array WHERE id = $1 FOR UPDATE`,
    [id],
  );
  if (rows.length === 0) {
    throw new ConfigInputError(
      "That approver no longer exists - reload to see the latest",
    );
  }
  return rows[0] as AdminApprover;
}

function requireStage(stage: unknown): ApproverStageKey {
  if (!isApproverStageKey(stage)) {
    throw new ConfigInputError("Choose an approver list");
  }
  return stage;
}

// A department from base_departments, or NO_DEPARTMENT for none
async function cleanDepartment(client: PoolClient, value: unknown) {
  if (value === null || value === "") return NO_DEPARTMENT;
  if (typeof value !== "string")
    throw new ConfigInputError("Choose a department");
  const { rows } = await client.query(
    `SELECT 1 FROM base_departments WHERE department_name = $1`,
    [value],
  );
  if (rows.length === 0)
    throw new ConfigInputError("Choose a listed department");
  return value;
}

function cleanHrForms(value: unknown): HrForm[] {
  if (!isHrFormList(value) || value.length === 0) {
    throw new ConfigInputError("Choose at least one form");
  }
  return [...new Set(value)].sort();
}

export async function addApprover(
  stageValue: unknown,
  input: {
    name?: unknown;
    email?: unknown;
    department?: unknown;
    isAlternateOnly?: unknown;
    hrForms?: unknown;
  },
) {
  return runConfigChange(
    isApproverStageKey(stageValue) ? tagFor(stageValue) : null,
    async (client, actor) => {
      const key = requireStage(stageValue);
      const name = cleanConfigName(input.name, "approver");
      const email = cleanConfigEmail(input.email);

      // A deactivated user can't be an approver (deactivateUser refuses
      // approvers); the share lock waits out a deactivation in progress
      const user = await client.query(
        `SELECT deactivated_at IS NOT NULL AS deactivated
         FROM users WHERE email = $1 FOR SHARE`,
        [email],
      );
      if (user.rows[0]?.deactivated) {
        throw new ConfigInputError(
          `${email} is deactivated - reactivate them on the Users & roles tab first`,
        );
      }

      const existing = await client.query(
        `SELECT 1 FROM ${key}_array WHERE ${key}_email = $1`,
        [email],
      );
      if (existing.rows.length > 0) {
        throw new ConfigInputError(
          `${email} is already a ${stageLabel(key)} approver`,
        );
      }

      let after: Record<string, unknown>;
      if (key === "hod") {
        const department = await cleanDepartment(client, input.department);
        const isAlternateOnly = input.isAlternateOnly === true;
        const { rows } = await client.query(
          `INSERT INTO hod_array (hod_name, hod_email, hod_department, is_alternate_only)
         VALUES ($1, $2, $3, $4) RETURNING id`,
          [name, email, department, isAlternateOnly],
        );
        after = { id: rows[0].id, name, email, department, isAlternateOnly };
      } else if (key === "hr") {
        const hrForms = cleanHrForms(input.hrForms);
        const { rows } = await client.query(
          `INSERT INTO hr_array (hr_name, hr_email, hr_forms)
         VALUES ($1, $2, $3) RETURNING id`,
          [name, email, hrForms],
        );
        after = { id: rows[0].id, name, email, hrForms };
      } else {
        const { rows } = await client.query(
          `INSERT INTO ${key}_array (${key}_name, ${key}_email)
         VALUES ($1, $2) RETURNING id`,
          [name, email],
        );
        after = { id: rows[0].id, name, email };
      }

      await recordConfigChange(client, actor, {
        table: `${key}_array`,
        key: after.id as number,
        action: "create",
        summary: `Added ${name} (${email}) as a ${stageLabel(key)} approver`,
        after,
      });
      return `Added ${name}`;
    },
  );
}

export async function removeApprover(stageValue: unknown, id: unknown) {
  return runConfigChange(
    isApproverStageKey(stageValue) ? tagFor(stageValue) : null,
    async (client, actor) => {
      const stage = requireStage(stageValue);
      const approver = await loadApprover(client, stage, id);

      const blocker = await approverRemovalBlocker(client, stage, approver);
      if (blocker) {
        throw new ConfigInputError(
          `${approver.name} can't be removed: ${blocker}`,
        );
      }

      // Alternate links go too (hod_alternates ON DELETE CASCADE)
      await client.query(`DELETE FROM ${stage}_array WHERE id = $1`, [
        approver.id,
      ]);
      const summary = `Removed ${approver.name} (${approver.email}) as a ${stageLabel(stage)} approver`;
      await recordConfigChange(client, actor, {
        table: `${stage}_array`,
        key: approver.id,
        action: "delete",
        summary,
        before: approver,
      });
      return summary;
    },
  );
}

export async function regenerateApproverLink(stageValue: unknown, id: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const stage = requireStage(stageValue);
    const approver = await loadApprover(client, stage, id);

    await client.query(
      `UPDATE ${stage}_array SET ${stage}_uuid = gen_random_uuid() WHERE id = $1`,
      [approver.id],
    );
    // The token itself is never recorded
    const summary = `Regenerated the ${stageLabel(stage)} approval link of ${approver.name} (${approver.email})`;
    await recordConfigChange(client, actor, {
      table: `${stage}_array`,
      key: approver.id,
      action: "update",
      summary,
    });
    return summary;
  });
}

export async function setHodDepartment(id: unknown, department: unknown) {
  return runConfigChange("GetHodArray", async (client, actor) => {
    const hod = await loadApprover(client, "hod", id);
    const value = await cleanDepartment(client, department);
    if (value === hod.department) {
      throw new ConfigInputError("That is already their department");
    }

    await client.query(
      `UPDATE hod_array SET hod_department = $2 WHERE id = $1`,
      [hod.id, value],
    );
    const summary =
      value === NO_DEPARTMENT
        ? `Cleared the department of HOD ${hod.name}`
        : `Set the department of HOD ${hod.name} to ${value}`;
    await recordConfigChange(client, actor, {
      table: "hod_array",
      key: hod.id,
      action: "update",
      summary,
      before: { department: hod.department },
      after: { department: value },
    });
    return summary;
  });
}

export async function setHodAlternateOnly(
  id: unknown,
  isAlternateOnly: unknown,
) {
  return runConfigChange("GetHodArray", async (client, actor) => {
    const hod = await loadApprover(client, "hod", id);
    if (typeof isAlternateOnly !== "boolean") {
      throw new ConfigInputError("Choose whether they are alternate-only");
    }
    if (hod.isAlternateOnly === isAlternateOnly) {
      throw new ConfigInputError(
        "Nothing to change - reload to see the latest",
      );
    }

    await client.query(
      `UPDATE hod_array SET is_alternate_only = $2 WHERE id = $1`,
      [hod.id, isAlternateOnly],
    );
    const summary = isAlternateOnly
      ? `Made ${hod.name} an alternate-only HOD (no longer offered on the forms)`
      : `Made ${hod.name} a selectable HOD on the forms`;
    await recordConfigChange(client, actor, {
      table: "hod_array",
      key: hod.id,
      action: "update",
      summary,
      before: { isAlternateOnly: !isAlternateOnly },
      after: { isAlternateOnly },
    });
    return summary;
  });
}

export async function addHodAlternate(hodId: unknown, alternateId: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const hod = await loadApprover(client, "hod", hodId);
    const alternate = await loadApprover(client, "hod", alternateId);
    if (hod.id === alternate.id) {
      throw new ConfigInputError("A HOD can't be their own alternate");
    }

    const { rowCount } = await client.query(
      `INSERT INTO hod_alternates (hod_id, alternate_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [hod.id, alternate.id],
    );
    if (rowCount === 0) {
      throw new ConfigInputError(
        `${alternate.name} already covers ${hod.name}`,
      );
    }
    const summary = `Made ${alternate.name} an alternate for HOD ${hod.name}`;
    await recordConfigChange(client, actor, {
      table: "hod_alternates",
      key: `${hod.id}:${alternate.id}`,
      action: "create",
      summary,
      after: { hod: hod.email, alternate: alternate.email },
    });
    return summary;
  });
}

export async function removeHodAlternate(hodId: unknown, alternateId: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const hod = await loadApprover(client, "hod", hodId);
    const alternate = await loadApprover(client, "hod", alternateId);

    const { rowCount } = await client.query(
      `DELETE FROM hod_alternates WHERE hod_id = $1 AND alternate_id = $2`,
      [hod.id, alternate.id],
    );
    if (rowCount === 0) {
      throw new ConfigInputError(
        `${alternate.name} no longer covers ${hod.name} - reload to see the latest`,
      );
    }
    const summary = `${alternate.name} is no longer an alternate for HOD ${hod.name}`;
    await recordConfigChange(client, actor, {
      table: "hod_alternates",
      key: `${hod.id}:${alternate.id}`,
      action: "delete",
      summary,
      before: { hod: hod.email, alternate: alternate.email },
    });
    return summary;
  });
}

export async function setHrForms(id: unknown, forms: unknown) {
  return runConfigChange(null, async (client, actor) => {
    const hr = await loadApprover(client, "hr", id);
    const hrForms = cleanHrForms(forms);
    const before = [...(hr.hrForms ?? [])].sort();
    if (before.join() === hrForms.join()) {
      throw new ConfigInputError("Nothing to change");
    }

    const dropped = before.filter((form) => !hrForms.includes(form));
    const blocker = await hrFormsChangeBlocker(client, hr.id, dropped);
    if (blocker) {
      throw new ConfigInputError(
        `Can't remove that form from ${hr.name}: ${blocker}`,
      );
    }

    await client.query(`UPDATE hr_array SET hr_forms = $2 WHERE id = $1`, [
      hr.id,
      hrForms,
    ]);
    const summary = `Set the HR forms of ${hr.name} to ${hrForms.join(", ")}`;
    await recordConfigChange(client, actor, {
      table: "hr_array",
      key: hr.id,
      action: "update",
      summary,
      before: { hrForms: before },
      after: { hrForms },
    });
    return summary;
  });
}
