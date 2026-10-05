import { PoolClient } from "pg";
import { query } from "@/lib/db";
import type { ApproversObject } from "@/lib/loadApprovers";

// The HOD stage is a single ASSIGNED HOD (selected at submission and stored
// on the requisition row in *_hod_email / hod_approver_email) plus that HOD's
// permanent alternates (hod_alternates, migration 018_hod_alternates.sql).
// Any of them may act, first click wins. Being a member of hod_array alone
// is not enough - otherwise any HOD holding their own approval token could
// act on another HOD's requisition. The assigned HOD email is never
// overwritten when the stage is acted on; whoever acted is recorded in
// *_hod_actioned_by_email, and later-stage emails go to that address.

export const NOT_ASSIGNED_HOD_MESSAGE =
  "You are not the assigned HOD or an alternate HOD approver for this requisition, no action is required";

export const HOD_SELF_APPROVAL_MESSAGE =
  "You cannot approve a requisition you submitted, another HOD approver will act on it";

// Emails are compared case-insensitively - Entra and hod_array can disagree
// on casing for the same mailbox.
export const sameEmail = (
  a: string | null | undefined,
  b: string | null | undefined,
) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

// Emails of the HODs the email in `param` is an alternate for
const coveredHodsSql = (param: string) => `
  SELECT h.hod_email FROM hod_alternates x
  JOIN hod_array h ON h.id = x.hod_id
  JOIN hod_array a ON a.id = x.alternate_id
  WHERE a.hod_email = ${param}`;

async function isAlternateOf(
  client: Pick<PoolClient, "query"> | null,
  alternateEmail: string,
  hodEmail: string,
): Promise<boolean> {
  const sql = `
    SELECT 1 FROM hod_alternates x
    JOIN hod_array h ON h.id = x.hod_id
    JOIN hod_array a ON a.id = x.alternate_id
    WHERE LOWER(h.hod_email) = LOWER($1) AND LOWER(a.hod_email) = LOWER($2)
    LIMIT 1`;
  const params = [hodEmail, alternateEmail];
  const rows = client
    ? (await client.query(sql, params)).rows
    : await query(sql, params);
  return rows.length > 0;
}

export interface ResolvedHod {
  uuid: string;
  name: string;
  email: string;
}

// Resolves the HOD picked on a submission/amendment form, which sends the
// HOD's email (hod_email is unique; names are not). Returns null when no
// such HOD exists (e.g. a stale/tampered value) or when it is an
// alternate-only HOD, which can never be selected as the assigned HOD. The
// name stored on the requisition comes from here, never from the client.
export async function resolveHod(
  hodEmail: string,
): Promise<ResolvedHod | null> {
  if (typeof hodEmail !== "string" || !hodEmail.trim()) return null;

  const result = await query<ResolvedHod>(
    `
    SELECT hod_uuid AS uuid, hod_name AS name, hod_email AS email
    FROM hod_array WHERE hod_email = $1 AND is_alternate_only = false LIMIT 1
    `,
    [hodEmail.trim().toLowerCase()],
  );

  return result[0] ?? null;
}

// Returns null when `approverEmail` may act on the HOD stage, otherwise the
// message to show. Run inside the update transaction (pass its client); the
// approval pages pass null to run the same check before rendering.
export async function getHodActionError(
  client: Pick<PoolClient, "query"> | null,
  {
    approverEmail,
    assignedHodEmail,
    submitterEmail,
  }: {
    approverEmail: string;
    assignedHodEmail: string | null | undefined;
    submitterEmail: string | null | undefined;
  },
): Promise<string | null> {
  if (!assignedHodEmail) return NOT_ASSIGNED_HOD_MESSAGE;
  // A submitter who is an alternate of their own HOD must not approve their
  // own requisition (an assigned HOD who submits is auto-approved at
  // submission, so the stage is never pending for them).
  if (sameEmail(approverEmail, submitterEmail)) return HOD_SELF_APPROVAL_MESSAGE;
  if (sameEmail(approverEmail, assignedHodEmail)) return null;
  if (await isAlternateOf(client, approverEmail, assignedHodEmail)) return null;
  return NOT_ASSIGNED_HOD_MESSAGE;
}

// HOD-stage gate for the (approvers) pages, run before any requisition
// details are loaded so a HOD holding their own token can't view requisitions
// assigned to someone else. Same rule as the update actions. `table` and
// `hodEmailColumn` are fixed per form, never user input.
export type HodPageAccess =
  | { status: "ok" }
  | { status: "not_found" }
  | { status: "denied"; message: string };

export async function getHodPageAccess(
  table: string,
  hodEmailColumn: string,
  requestId: string,
  approverEmail: string,
): Promise<HodPageAccess> {
  const rows = await query<{
    assigned_hod_email: string | null;
    submitter_email: string;
  }>(
    `SELECT ${hodEmailColumn} AS assigned_hod_email, submitter_email
     FROM ${table} WHERE request_id = $1`,
    [requestId],
  );

  if (rows.length === 0) return { status: "not_found" };

  const message = await getHodActionError(null, {
    approverEmail,
    assignedHodEmail: rows[0].assigned_hod_email,
    submitterEmail: rows[0].submitter_email,
  });

  return message ? { status: "denied", message } : { status: "ok" };
}

// Pending-queue scope: requisitions assigned to me, plus those assigned to a
// HOD I'm an alternate for (excluding my own submissions). `param` is the
// placeholder (e.g. "$2") bound to the viewer's email.
export function hodPendingScopeSql(
  hodColumn: string,
  submitterColumn: string,
  param: string,
): string {
  return `(${hodColumn} = ${param} OR (${hodColumn} IN (${coveredHodsSql(param)}) AND ${submitterColumn} <> ${param}))`;
}

// History scope: the assigned HOD sees everything assigned to them whoever
// acted; an alternate sees only what they actually acted on.
export function hodHistoryScopeSql(
  hodColumn: string,
  actionedByColumn: string,
  param: string,
): string {
  return `(${hodColumn} = ${param} OR ${actionedByColumn} = ${param})`;
}

// Read access for detail views/attachments: the assigned HOD, whoever acted
// on the HOD stage, or - while the stage is still pending - an alternate of
// the assigned HOD (they need to see it to review it).
export async function isHodViewer(
  email: string,
  {
    assignedHodEmail,
    actionedByEmail,
    hodStatus,
  }: {
    assignedHodEmail: string | null | undefined;
    actionedByEmail: string | null | undefined;
    hodStatus: string | null | undefined;
  },
): Promise<boolean> {
  if (sameEmail(email, assignedHodEmail) || sameEmail(email, actionedByEmail))
    return true;
  if (hodStatus !== "pending" || !assignedHodEmail) return false;
  return isAlternateOf(null, email, assignedHodEmail);
}

// Alternates of the assigned HOD, for the HOD-stage "Action Required" fan-out.
// Each alternate's own hod_uuid is their approval token. `excludeEmail` drops
// the submitter so nobody is asked to approve their own requisition.
// Deliberately not in lib/loadAppDataV2.ts ("use server"), so the tokens are
// never exposed as a client-callable server action (see lib/loadApprovers.ts).
export async function loadHodAlternates(
  hodEmail: string,
  excludeEmail?: string,
): Promise<ApproversObject[]> {
  try {
    const result = await query<ApproversObject>(
      `
      SELECT a.hod_uuid AS uuid, a.hod_name AS name, a.hod_email AS email
      FROM hod_alternates x
      JOIN hod_array h ON h.id = x.hod_id
      JOIN hod_array a ON a.id = x.alternate_id
      WHERE LOWER(h.hod_email) = LOWER($1)
      `,
      [hodEmail],
    );
    return result.filter((alt) => !sameEmail(alt.email, excludeEmail));
  } catch (error) {
    console.error("Error while trying to fetch HOD alternates:", error);
    return [];
  }
}

// Name of the ASSIGNED HOD for SQL selects. The *_hod_approver name column
// is overwritten with whoever acted on the HOD stage (possibly an alternate),
// so amendment diffing must resolve the assigned HOD's name from their
// stored email instead. Falls back to the name column if the HOD has
// since been removed from hod_array.
export function assignedHodNameSql(
  hodEmailColumn: string,
  hodNameColumn: string,
): string {
  return `COALESCE((SELECT h.hod_name FROM hod_array h WHERE h.hod_email = ${hodEmailColumn} LIMIT 1), ${hodNameColumn})`;
}
