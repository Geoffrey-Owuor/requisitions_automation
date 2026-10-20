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
