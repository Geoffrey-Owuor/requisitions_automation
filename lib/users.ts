import "server-only";
import { query } from "@/lib/db";

// Records a sign-in in users (migration 029): creates the row on a first
// sign-in, otherwise refreshes the name from Entra ID. A failure is logged
// and swallowed - it must never block signing in, since roles are read by
// email and still work for a row that exists.
export async function recordSignIn(email: string, name: string) {
  try {
    await query(
      `INSERT INTO users (email, username, last_sign_in_at)
       VALUES (LOWER(TRIM($1)), $2, NOW())
       ON CONFLICT (email) DO UPDATE
       SET username = EXCLUDED.username, last_sign_in_at = NOW()`,
      [email, name],
    );
  } catch (error) {
    console.error("Error while recording a sign-in:", error);
  }
}

// Whether a config admin has deactivated this account (migration 031). Read
// on every getSession and at sign-in. A lookup failure counts as active: a
// database blip must not sign everyone out (proxy.ts deletes the cookie of a
// /dashboard request without a session), and a deactivated user can't do
// anything while the database is unreachable anyway.
export async function isUserDeactivated(email: string) {
  try {
    const rows = await query<{ deactivated: boolean }>(
      `SELECT deactivated_at IS NOT NULL AS deactivated
       FROM users WHERE email = LOWER(TRIM($1))`,
      [email],
    );
    return rows[0]?.deactivated === true;
  } catch (error) {
    console.error("Error while checking whether a user is deactivated:", error);
    return false;
  }
}
