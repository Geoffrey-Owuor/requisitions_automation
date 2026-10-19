"use server";
import { query } from "@/lib/db";
import {
  cleanConfigName,
  ConfigInputError,
  getConfigAdminSession,
  isConfigId,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's IT tab: the requirement checkboxes on the IT form
// (it_requirement_items, migration 027). Items are added and
// (de)activated, never renamed - it_requisitions stores the chosen names.

export interface ItConfigAdminData {
  items: { id: number; name: string; isActive: boolean }[];
  changes: {
    id: string;
    summary: string;
    changedByName: string;
    changedAt: string;
  }[];
}

export async function getItConfigAdminData(): Promise<ItConfigAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [items, changes] = await Promise.all([
    query<{ id: number; name: string; isActive: boolean }>(
      `SELECT id, item_name AS name, is_active AS "isActive"
       FROM it_requirement_items ORDER BY id`,
    ),
    query<ItConfigAdminData["changes"][number]>(
      `SELECT id::text, summary, changed_by_name AS "changedByName",
       TO_CHAR(changed_at AT TIME ZONE 'Africa/Nairobi', 'DD Mon YYYY, HH24:MI') AS "changedAt"
       FROM config_changes WHERE table_name = 'it_requirement_items'
       ORDER BY changed_at DESC, id DESC LIMIT 30`,
    ),
  ]);

  return { items, changes };
}

export async function addItRequirementItem(name: unknown) {
  return runConfigChange("GetItRequirementItems", async (client, actor) => {
    const itemName = cleanConfigName(name, "requirement");
    // The chosen items are stored joined with ", "
    if (itemName.includes(",")) {
      throw new ConfigInputError("A requirement name cannot contain a comma");
    }

    const { rows } = await client.query(
      `INSERT INTO it_requirement_items (item_name) VALUES ($1)
       RETURNING id, item_name, is_active`,
      [itemName],
    );
    await recordConfigChange(client, actor, {
      table: "it_requirement_items",
      key: rows[0].id,
      action: "create",
      summary: `Added IT requirement "${itemName}"`,
      after: rows[0],
    });
    return `Added "${itemName}"`;
  });
}

export async function setItRequirementItemActive(
  id: unknown,
  isActive: unknown,
) {
  return runConfigChange("GetItRequirementItems", async (client, actor) => {
    if (!isConfigId(id) || typeof isActive !== "boolean") {
      throw new ConfigInputError("Choose a requirement");
    }

    const { rows } = await client.query(
      `UPDATE it_requirement_items SET is_active = $2
       WHERE id = $1 AND is_active <> $2 RETURNING id, item_name AS name`,
      [id, isActive],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        `That requirement was already ${isActive ? "active" : "inactive"} - reload to see the latest`,
      );
    }

    const summary = `${isActive ? "Reactivated" : "Deactivated"} IT requirement "${rows[0].name}"`;
    await recordConfigChange(client, actor, {
      table: "it_requirement_items",
      key: id,
      action: "update",
      summary,
      before: { is_active: !isActive },
      after: { is_active: isActive },
    });
    return summary;
  });
}
