import "server-only";
import type { PoolClient } from "pg";
import type { HrForm } from "@/public/assets";
import type { ApproverStageKey } from "@/lib/approverStages";
import { employeeStageReachedSql } from "@/lib/employeeApprovalOrder";

// What removing an approver (or narrowing an HR approver's forms) would
// leave with nobody able to act - the Approvers tab refuses such changes.
//
// The HOD stage belongs to the HOD assigned at submission (stored by email
// on the requisition), so a HOD with pending requisitions can never be
// removed: their alternates go with them (ON DELETE CASCADE). Every other
// stage is shared by its whole array, so only its last member is blocked,
// and only while that stage has pending requisitions.

// Requisitions waiting on the HOD assigned by `email`, across every type
const HOD_PENDING_SQL = `
  SELECT
    (SELECT COUNT(*) FROM it_requisitions
      WHERE hod_approver_email = $1 AND hod_approver_status = 'pending')
  + (SELECT COUNT(*) FROM access_requisitions
      WHERE hod_approver_email = $1 AND hod_approver_status = 'pending')
  + (SELECT COUNT(*) FROM travel_requisitions
      WHERE travel_hod_email = $1 AND travel_hod_approval_status = 'pending')
  + (SELECT COUNT(*) FROM casual_requisitions
      WHERE casual_hod_email = $1 AND casual_hod_approval_status = 'pending')
  + (SELECT COUNT(*) FROM employee_requisitions
      WHERE employee_hod_email = $1 AND employee_hod_approval_status = 'pending')
  AS count`;

// Requisitions waiting on each shared stage - the same conditions as the
// stage's dashboard pending queue (serverActions/Get{Type}RequisitionData.ts)
const STAGE_PENDING_SQL: Record<
  Exclude<ApproverStageKey, "hod" | "hr">,
  string | null
> = {
  it: `SELECT COUNT(*) AS count FROM it_requisitions
    WHERE hod_approver_status = 'approved' AND it_approver_status = 'pending'`,
  security: `SELECT COUNT(*) AS count FROM access_requisitions
    WHERE hod_approver_status = 'approved' AND security_approver_status = 'pending'`,
  director: `SELECT
    (SELECT COUNT(*) FROM travel_requisitions
      WHERE travel_hod_approval_status = 'approved'
      AND travel_hr_approval_status = 'approved'
      AND travel_director_approval_status = 'pending')
  + (SELECT COUNT(*) FROM employee_requisitions
      WHERE ${employeeStageReachedSql("employee_requisitions", "director")}
      AND employee_director_approval_status = 'pending')
  AS count`,
  retail_director: `SELECT COUNT(*) AS count FROM employee_requisitions
    WHERE employee_hod_approval_status = 'approved'
    AND employee_retail_director_approval_status = 'pending'`,
  // No approval flow uses the Finance array
  finance: null,
};

const HR_PENDING_SQL: Record<HrForm, string> = {
  travel: `SELECT COUNT(*) AS count FROM travel_requisitions
    WHERE travel_hod_approval_status = 'approved'
    AND travel_hr_approval_status = 'pending'`,
  casual: `SELECT COUNT(*) AS count FROM casual_requisitions
    WHERE casual_hod_approval_status = 'approved'
    AND casual_hr_approval_status = 'pending'`,
  employee: `SELECT COUNT(*) AS count FROM employee_requisitions
    WHERE ${employeeStageReachedSql("employee_requisitions", "hr")}
    AND employee_hr_approval_status = 'pending'`,
};

async function count(client: PoolClient, sql: string, params: string[] = []) {
  const { rows } = await client.query<{ count: string }>(sql, params);
  return Number(rows[0].count);
}

const requisitions = (n: number) =>
  `${n} pending requisition${n === 1 ? "" : "s"}`;

// HR forms that would have pending requisitions and no HR approver left if
// the approver `id` stopped covering `dropped`. Call with the hr_array rows
// locked.
async function strandedHrForms(
  client: PoolClient,
  id: number,
  dropped: HrForm[],
): Promise<string | null> {
  for (const form of dropped) {
    const others = await count(
      client,
      `SELECT COUNT(*) AS count FROM hr_array WHERE id <> $1 AND $2 = ANY(hr_forms)`,
      [String(id), form],
    );
    if (others > 0) continue;
    const pending = await count(client, HR_PENDING_SQL[form]);
    if (pending > 0) {
      return `they are the only HR approver for ${form} requisitions and ${requisitions(pending)} are waiting at HR`;
    }
  }
  return null;
}

// Why the approver can't be removed, or null when they can. Locks the
// stage's rows so two admins can't each remove one of its last two members.
export async function approverRemovalBlocker(
  client: PoolClient,
  stage: ApproverStageKey,
  approver: { id: number; email: string; hrForms?: HrForm[] },
): Promise<string | null> {
  await client.query(`SELECT id FROM ${stage}_array FOR UPDATE`);

  if (stage === "hod") {
    const pending = await count(client, HOD_PENDING_SQL, [approver.email]);
    return pending > 0
      ? `${requisitions(pending)} are assigned to them as HOD - they need to be actioned first`
      : null;
  }

  if (stage === "hr") {
    return strandedHrForms(client, approver.id, approver.hrForms ?? []);
  }

  const sql = STAGE_PENDING_SQL[stage];
  if (!sql) return null;
  const others = await count(
    client,
    `SELECT COUNT(*) AS count FROM ${stage}_array WHERE id <> $1`,
    [String(approver.id)],
  );
  if (others > 0) return null;
  const pending = await count(client, sql);
  return pending > 0
    ? `they are the only member and ${requisitions(pending)} are waiting at this stage`
    : null;
}

// Why an HR approver can't stop covering `dropped`, or null
export async function hrFormsChangeBlocker(
  client: PoolClient,
  id: number,
  dropped: HrForm[],
): Promise<string | null> {
  await client.query(`SELECT id FROM hr_array FOR UPDATE`);
  return strandedHrForms(client, id, dropped);
}

// Requisitions assigned to each HOD (by email) still waiting at HOD, for
// the Approvers tab's list
export async function hodPendingCounts(
  client: Pick<PoolClient, "query">,
): Promise<Map<string, number>> {
  const { rows } = await client.query<{ email: string; count: string }>(
    `SELECT email, COUNT(*) AS count FROM (
      SELECT hod_approver_email AS email FROM it_requisitions WHERE hod_approver_status = 'pending'
      UNION ALL SELECT hod_approver_email FROM access_requisitions WHERE hod_approver_status = 'pending'
      UNION ALL SELECT travel_hod_email FROM travel_requisitions WHERE travel_hod_approval_status = 'pending'
      UNION ALL SELECT casual_hod_email FROM casual_requisitions WHERE casual_hod_approval_status = 'pending'
      UNION ALL SELECT employee_hod_email FROM employee_requisitions WHERE employee_hod_approval_status = 'pending'
    ) pending WHERE email IS NOT NULL GROUP BY email`,
  );
  return new Map(rows.map((row) => [row.email, Number(row.count)]));
}
