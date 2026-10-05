import "server-only";
import { PoolClient } from "pg";
import type { HrForm } from "@/public/assets";

// The approver acting on an emailed approval link is resolved from the
// link's token ({stage}_array.{stage}_uuid), never from a client-supplied
// name/email - the Update*Status server actions are callable directly, so
// trusting the payload would let anyone act as any approver whose email
// they know. Mirrors PushbackTravelHrDecision.

export type TokenApproverResult =
  | { ok: true; name: string; email: string }
  | { ok: false; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INVALID_APPROVER_MESSAGE =
  "Could not verify the current approver, please contact your admin for support";

// `stage` is interpolated into the table name, so callers must validate it
// against the form's allowed stages first (isValid*Stage). HR approvers are
// additionally scoped to `hrForm` via their hr_forms allow-list.
export async function resolveApproverByToken(
  client: Pick<PoolClient, "query">,
  stage: string,
  token: string,
  hrForm?: HrForm,
): Promise<TokenApproverResult> {
  if (typeof token !== "string" || !UUID_PATTERN.test(token)) {
    return { ok: false, message: INVALID_APPROVER_MESSAGE };
  }

  const isHrStage = stage === "hr";
  const { rows } = await client.query(
    isHrStage
      ? `SELECT hr_name AS name, hr_email AS email, hr_forms
         FROM hr_array WHERE hr_uuid = $1 FOR UPDATE`
      : `SELECT ${stage}_name AS name, ${stage}_email AS email
         FROM ${stage}_array WHERE ${stage}_uuid = $1 FOR UPDATE`,
    [token],
  );

  if (rows.length === 0) {
    return { ok: false, message: INVALID_APPROVER_MESSAGE };
  }

  if (isHrStage && (!hrForm || !rows[0].hr_forms.includes(hrForm))) {
    return {
      ok: false,
      message: `You are not authorized to approve ${hrForm ?? "these"} requisitions, please contact your admin for support`,
    };
  }

  return { ok: true, name: rows[0].name, email: rows[0].email };
}
