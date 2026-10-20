"use server";
import { query } from "@/lib/db";
import {
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  isConfigId,
  loadConfigChanges,
  NAIROBI_TODAY_SQL,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Travel tab: the approval tier thresholds
// (travel_tier_thresholds, migration 027). Like casual rates, a change is a
// new row from tomorrow (Nairobi) or later, and only a row that hasn't
// taken effect yet can be deleted - one in effect may have tiered
// requisitions, and each requisition stores its tier.

const TAG = "GetTravelTiers";
const MAX_AMOUNT = 100_000_000;

export interface TravelTierRow {
  id: number;
  tier2Above: number;
  tier3From: number;
  effectiveFrom: string;
  status: "scheduled" | "current" | "past";
}

export interface TravelConfigAdminData {
  today: string;
  tiers: TravelTierRow[];
  changes: ConfigChangeRow[];
}

export async function getTravelConfigAdminData(): Promise<TravelConfigAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [[{ today }], tiers, changes] = await Promise.all([
    query<{ today: string }>(
      `SELECT TO_CHAR(${NAIROBI_TODAY_SQL}, 'YYYY-MM-DD') AS today`,
    ),
    // The current row is the latest one already in effect
    query<TravelTierRow>(
      `SELECT id, tier2_above AS "tier2Above", tier3_from AS "tier3From",
       TO_CHAR(effective_from, 'YYYY-MM-DD') AS "effectiveFrom",
       CASE
         WHEN effective_from > ${NAIROBI_TODAY_SQL} THEN 'scheduled'
         WHEN effective_from = (SELECT MAX(effective_from) FROM travel_tier_thresholds
           WHERE effective_from <= ${NAIROBI_TODAY_SQL}) THEN 'current'
         ELSE 'past'
       END AS status
       FROM travel_tier_thresholds ORDER BY effective_from DESC`,
    ),
    loadConfigChanges(["travel_tier_thresholds"]),
  ]);

  return { today, tiers, changes };
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_AMOUNT;

export async function addTravelTiers(input: {
  tier2Above?: unknown;
  tier3From?: unknown;
  effectiveFrom?: unknown;
}) {
  return runConfigChange(TAG, async (client, actor) => {
    const { tier2Above, tier3From, effectiveFrom } = input ?? {};
    if (!isAmount(tier2Above) || !isAmount(tier3From)) {
      throw new ConfigInputError("Enter both thresholds in whole shillings");
    }
    if (tier3From <= tier2Above) {
      throw new ConfigInputError(
        "Tier 3 must start above the Tier 1 limit, or there's no Tier 2",
      );
    }
    if (
      typeof effectiveFrom !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
    ) {
      throw new ConfigInputError("Choose the date the thresholds take effect");
    }

    const {
      rows: [check],
    } = await client.query<{ future: boolean }>(
      `SELECT $1::date > ${NAIROBI_TODAY_SQL} AS future`,
      [effectiveFrom],
    );
    if (!check.future) {
      throw new ConfigInputError(
        "New thresholds must take effect from tomorrow or later",
      );
    }

    const { rows } = await client.query(
      `INSERT INTO travel_tier_thresholds (tier2_above, tier3_from, effective_from)
       VALUES ($1, $2, $3) ON CONFLICT (effective_from) DO NOTHING
       RETURNING id, tier2_above, tier3_from,
       TO_CHAR(effective_from, 'YYYY-MM-DD') AS effective_from`,
      [tier2Above, tier3From, effectiveFrom],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "Thresholds already start on that date - delete them first",
      );
    }

    const summary = `Scheduled travel tiers from ${effectiveFrom}: Tier 1 up to KES ${tier2Above.toLocaleString()}, Tier 3 from KES ${tier3From.toLocaleString()}`;
    await recordConfigChange(client, actor, {
      table: "travel_tier_thresholds",
      key: rows[0].id,
      action: "create",
      summary,
      after: rows[0],
    });
    return summary;
  });
}

export async function deleteTravelTiers(id: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    if (!isConfigId(id)) throw new ConfigInputError("Choose the thresholds");

    const { rows } = await client.query(
      `DELETE FROM travel_tier_thresholds
       WHERE id = $1 AND effective_from > ${NAIROBI_TODAY_SQL}
       RETURNING id, tier2_above, tier3_from,
       TO_CHAR(effective_from, 'YYYY-MM-DD') AS effective_from`,
      [id],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "Only thresholds that haven't taken effect yet can be deleted",
      );
    }

    const summary = `Deleted the travel tiers scheduled from ${rows[0].effective_from}`;
    await recordConfigChange(client, actor, {
      table: "travel_tier_thresholds",
      key: id,
      action: "delete",
      summary,
      before: rows[0],
    });
    return summary;
  });
}
