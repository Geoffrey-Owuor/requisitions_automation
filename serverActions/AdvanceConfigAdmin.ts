"use server";
import { query } from "@/lib/db";
import { SUBMISSION_DEADLINE_DAY } from "@/lib/salaryAdvanceWindow";
import {
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  loadConfigChanges,
  NAIROBI_TODAY_SQL,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Salary advance tab: the manual extension of the
// submission window (salary_advance_settings.extended_until, migration
// 023). Staff must never learn an extension exists, so this lives only
// here, for config admins. It's a date, not a flag, so a forgotten one ends
// by itself; it can't be set past the end of next month.

export interface AdvanceConfigAdminData {
  today: string;
  deadlineDay: number;
  // Within the 1st-10th
  inRegularWindow: boolean;
  extendedUntil: string | null;
  isOpen: boolean;
  // Latest date an extension may run to
  maxDate: string;
  changes: ConfigChangeRow[];
}

const WINDOW_SQL = `
  SELECT TO_CHAR(${NAIROBI_TODAY_SQL}, 'YYYY-MM-DD') AS today,
  EXTRACT(DAY FROM ${NAIROBI_TODAY_SQL}) <= $1::int AS "inRegularWindow",
  TO_CHAR(s.extended_until, 'YYYY-MM-DD') AS "extendedUntil",
  COALESCE(s.extended_until >= ${NAIROBI_TODAY_SQL}, FALSE) AS extended,
  TO_CHAR((DATE_TRUNC('month', ${NAIROBI_TODAY_SQL}) + INTERVAL '2 months - 1 day')::date, 'YYYY-MM-DD') AS "maxDate"
  FROM salary_advance_settings s WHERE s.id = 1`;

export async function getAdvanceConfigAdminData(): Promise<AdvanceConfigAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [[row], changes] = await Promise.all([
    query<{
      today: string;
      inRegularWindow: boolean;
      extendedUntil: string | null;
      extended: boolean;
      maxDate: string;
    }>(WINDOW_SQL, [SUBMISSION_DEADLINE_DAY]),
    loadConfigChanges(["salary_advance_settings"]),
  ]);

  return {
    today: row.today,
    deadlineDay: SUBMISSION_DEADLINE_DAY,
    inRegularWindow: row.inRegularWindow,
    extendedUntil: row.extendedUntil,
    isOpen: row.inRegularWindow || row.extended,
    maxDate: row.maxDate,
    changes,
  };
}

// `until` is the last day (inclusive) submissions stay open, or null to end
// an extension now
export async function setAdvanceExtension(until: unknown) {
  return runConfigChange(null, async (client, actor) => {
    if (
      until !== null &&
      (typeof until !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(until))
    ) {
      throw new ConfigInputError("Choose the last day submissions stay open");
    }

    if (until !== null) {
      const {
        rows: [check],
      } = await client.query<{ ok: boolean }>(
        `SELECT $1::date BETWEEN ${NAIROBI_TODAY_SQL}
         AND (DATE_TRUNC('month', ${NAIROBI_TODAY_SQL}) + INTERVAL '2 months - 1 day')::date AS ok`,
        [until],
      );
      if (!check.ok) {
        throw new ConfigInputError(
          "Choose a date from today to the end of next month",
        );
      }
    }

    const { rows } = await client.query<{ before: string | null }>(
      `UPDATE salary_advance_settings s SET extended_until = $1, updated_at = NOW()
       FROM salary_advance_settings old WHERE s.id = 1 AND old.id = 1
       RETURNING TO_CHAR(old.extended_until, 'YYYY-MM-DD') AS before`,
      [until],
    );
    if (rows.length === 0) {
      throw new ConfigInputError("The salary advance settings row is missing");
    }
    if (rows[0].before === until) {
      throw new ConfigInputError("Nothing to change");
    }

    const summary = until
      ? `Extended salary advance submissions through ${until}`
      : "Ended the salary advance submission extension";
    await recordConfigChange(client, actor, {
      table: "salary_advance_settings",
      key: 1,
      action: "update",
      summary,
      before: { extended_until: rows[0].before },
      after: { extended_until: until },
    });
    return summary;
  });
}
