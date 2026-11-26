"use server";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { pool, query } from "@/lib/db";
import { config } from "@/lib/config";
import { createSession, normalizeEmail } from "@/lib/session";
import { isUserDeactivated, recordSignIn } from "@/lib/users";
import { safeReturnTo } from "@/lib/safeReturnTo";
import { sendEmail } from "@/services/EmailService";
import { HubSignInCodeTemplate } from "@/utils/templates/HubSignInCodeTemplate";
import {
  HUB_SIGN_IN_CODE_LENGTH,
  HUB_SIGN_IN_RESEND_SECONDS as RESEND_COOLDOWN_SECONDS,
} from "@/lib/hubSignIn";

// Email-code sign-in to the Hub, alongside Microsoft Entra ID: any address on
// one of HUB_SIGN_IN_EMAIL_DOMAINS gets a one-time code by email, and the
// code issues the same session cookie the Entra callback does. Codes live in
// hub_sign_in_codes (migration 042) as an HMAC, never in plain text.
//
// Unlike the salary advance verification, this doesn't hide whether an
// address is eligible: every address on the domain is, and the domain is
// shown on the login page anyway.

const EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_EMAIL_PER_HOUR = 5;
const MAX_CODES_PER_IP_PER_HOUR = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type HubSignInResult =
  | { ok: true; message: string; redirectTo?: string }
  | { ok: false; message: string; retryAfterSeconds?: number };

const failure = (message: string, retryAfterSeconds?: number) =>
  ({ ok: false, message, retryAfterSeconds }) as const;

const DEACTIVATED_MESSAGE =
  "Your account has been deactivated. Please contact your administrator if you need access.";
const SERVER_ERROR = "Something went wrong, please try again.";

function hashCode(email: string, code: string) {
  return createHmac("sha256", config.sessionSecret)
    .update(`${email}:${code}`)
    .digest("hex");
}

async function requestIp() {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ||
    headersList.get("x-real-ip")?.slice(0, 64) ||
    null
  );
}

// The email, lowercased, if code sign-in is on and the address is on an
// allowed domain; otherwise the message to show
function checkEmail(raw: unknown): { email: string } | { error: string } {
  const domains = config.hubSignInEmailDomains;
  if (domains.length === 0) {
    return { error: "Email-code sign-in isn't available. Use Microsoft 365." };
  }
  const email = typeof raw === "string" ? normalizeEmail(raw) : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return { error: "Enter a valid email address." };
  }
  if (!domains.includes(email.slice(email.lastIndexOf("@") + 1))) {
    return {
      error: `Use your work email (${domains.map((d) => `@${d}`).join(" or ")}).`,
    };
  }
  return { email };
}

export async function requestHubSignInCode(
  rawEmail: unknown,
): Promise<HubSignInResult> {
  const checked = checkEmail(rawEmail);
  if ("error" in checked) return failure(checked.error);
  const { email } = checked;

  try {
    if (await isUserDeactivated(email)) return failure(DEACTIVATED_MESSAGE);

    const ip = await requestIp();
    const [limits] = await query<{
      last_age_seconds: number | null;
      email_count: number;
      ip_count: number;
    }>(
      `SELECT
         (SELECT EXTRACT(EPOCH FROM NOW() - MAX(created_at))::int
            FROM hub_sign_in_codes WHERE email = $1) AS last_age_seconds,
         (SELECT COUNT(*)::int FROM hub_sign_in_codes
            WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour') AS email_count,
         (SELECT COUNT(*)::int FROM hub_sign_in_codes
            WHERE $2::text IS NOT NULL AND requested_ip = $2
            AND created_at > NOW() - INTERVAL '1 hour') AS ip_count`,
      [email, ip],
    );

    if (
      limits.last_age_seconds !== null &&
      limits.last_age_seconds < RESEND_COOLDOWN_SECONDS
    ) {
      const wait = RESEND_COOLDOWN_SECONDS - limits.last_age_seconds;
      return failure(
        `A code was just sent. You can request another in ${wait} seconds.`,
        wait,
      );
    }
    if (
      limits.email_count >= MAX_CODES_PER_EMAIL_PER_HOUR ||
      limits.ip_count >= MAX_CODES_PER_IP_PER_HOUR
    ) {
      return failure(
        "Too many codes have been requested. Please try again later, or sign in with Microsoft 365.",
      );
    }

    // Read before the code row is written, so a missing HUB_EMAIL_SENDER
    // fails the request without leaving a row that counts against the limits
    const sender = config.email.senders.hub;

    const code = randomInt(0, 10 ** HUB_SIGN_IN_CODE_LENGTH)
      .toString()
      .padStart(HUB_SIGN_IN_CODE_LENGTH, "0");

    // Only the newest code works: earlier unused ones are consumed
    const client = await pool.connect();
    let codeId: number;
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE hub_sign_in_codes SET consumed_at = NOW()
         WHERE email = $1 AND consumed_at IS NULL`,
        [email],
      );
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO hub_sign_in_codes (email, code_hash, requested_ip, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '${EXPIRY_MINUTES} minutes')
         RETURNING id`,
        [email, hashCode(email, code), ip],
      );
      codeId = rows[0].id;
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    const sent = await sendEmail({
      from: sender,
      to: email,
      subject: `${code} is your Apps Hub sign-in code`,
      html: HubSignInCodeTemplate({ code, expiryMinutes: EXPIRY_MINUTES }),
    });
    if (!sent.success) {
      // Not counted against the limits, so the user can simply try again
      await query(`DELETE FROM hub_sign_in_codes WHERE id = $1`, [codeId]);
      return failure(
        "We couldn't send the code. Please try again, or sign in with Microsoft 365.",
      );
    }

    return {
      ok: true,
      message: `We've sent a ${HUB_SIGN_IN_CODE_LENGTH}-digit code to ${email}. It expires in ${EXPIRY_MINUTES} minutes.`,
    };
  } catch (error) {
    console.error("Error while sending a hub sign-in code:", error);
    return failure(SERVER_ERROR);
  }
}

// "jane.doe" -> "Jane Doe", for an address that has never signed in
function nameFromEmail(email: string) {
  const name = email
    .slice(0, email.lastIndexOf("@"))
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
  return name || email;
}

export async function verifyHubSignInCode(
  rawEmail: unknown,
  rawCode: unknown,
  returnTo: unknown,
): Promise<HubSignInResult> {
  const checked = checkEmail(rawEmail);
  if ("error" in checked) return failure(checked.error);
  const { email } = checked;
  const code = typeof rawCode === "string" ? rawCode.replace(/\s/g, "") : "";
  if (!new RegExp(`^\\d{${HUB_SIGN_IN_CODE_LENGTH}}$`).test(code)) {
    return failure(`Enter the ${HUB_SIGN_IN_CODE_LENGTH}-digit code.`);
  }

  try {
    // Locked, so two guesses at once can't both get the last attempt
    const client = await pool.connect();
    let verdict: "ok" | "expired" | "wrong" | "locked";
    let attemptsLeft = 0;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{
        id: number;
        code_hash: string;
        attempts: number;
        live: boolean;
      }>(
        `SELECT id, code_hash, attempts, expires_at > NOW() AS live
         FROM hub_sign_in_codes
         WHERE email = $1 AND consumed_at IS NULL
         ORDER BY created_at DESC LIMIT 1
         FOR UPDATE`,
        [email],
      );
      const row = rows[0];
      if (!row || !row.live) {
        verdict = "expired";
      } else {
        const matches = timingSafeEqual(
          Buffer.from(row.code_hash),
          Buffer.from(hashCode(email, code)),
        );
        const attempts = row.attempts + 1;
        attemptsLeft = MAX_ATTEMPTS - attempts;
        verdict = matches ? "ok" : attemptsLeft > 0 ? "wrong" : "locked";
        await client.query(
          `UPDATE hub_sign_in_codes
           SET attempts = $2,
               consumed_at = CASE WHEN $3 THEN NOW() ELSE NULL END
           WHERE id = $1`,
          [row.id, attempts, verdict !== "wrong"],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (verdict === "expired") {
      return failure(
        "This code has expired or was replaced. Request a new one.",
      );
    }
    if (verdict === "locked") {
      return failure("Too many wrong attempts. Request a new code.");
    }
    if (verdict === "wrong") {
      return failure(
        `That code isn't right. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
      );
    }

    // Checked before any session is issued, as the Entra callback does
    if (await isUserDeactivated(email)) return failure(DEACTIVATED_MESSAGE);

    // Keep the name Entra ID (or a config admin) gave the account
    const [existing] = await query<{ username: string | null }>(
      `SELECT username FROM users WHERE email = $1`,
      [email],
    );
    const name = existing?.username?.trim() || nameFromEmail(email);

    await createSession({ name, email });
    await recordSignIn(email, name, { refreshName: false });

    return {
      ok: true,
      message: "Signed in",
      redirectTo: safeReturnTo(
        typeof returnTo === "string" ? returnTo : undefined,
      ),
    };
  } catch (error) {
    console.error("Error while verifying a hub sign-in code:", error);
    return failure(SERVER_ERROR);
  }
}
