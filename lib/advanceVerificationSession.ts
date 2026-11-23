import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { config } from "@/lib/config";
import { query } from "@/lib/db";

// Read on use: a missing SESSION_SECRET throws a named error from the call
// that needs it, outside decrypt's catch so it isn't mistaken for a bad token
function secretKey() {
  return new TextEncoder().encode(config.sessionSecret);
}
const COOKIE_NAME = "advance_form_session";
const SESSION_DURATION = "60m";

export type AdvanceVerificationPayload = {
  staffNumber: string;
  staffName: string;
  staffEmail: string;
  department: string;
  location: string;
};

async function encrypt(payload: AdvanceVerificationPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secretKey());
}

async function decrypt(
  token: string,
): Promise<AdvanceVerificationPayload | null> {
  const key = secretKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as AdvanceVerificationPayload;
  } catch {
    return null;
  }
}

export async function createAdvanceFormSession(
  staff: AdvanceVerificationPayload,
) {
  const token = await encrypt(staff);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour, matching the JWT expiration
  });
}

export async function getAdvanceFormSession(): Promise<AdvanceVerificationPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const staff = await decrypt(token);
  if (!staff || (await isStaffDeactivated(staff.staffNumber))) return null;
  return staff;
}

// A session issued before HR deactivated the record stops working on its
// next request (migration 032). Fails open on a database error, like
// isUserDeactivated, and every caller queries the database next anyway.
async function isStaffDeactivated(staffNumber: string) {
  try {
    const rows = await query<{ deactivated: boolean }>(
      `SELECT deactivated_at IS NOT NULL AS deactivated
       FROM company_staff_data WHERE staff_number = $1 LIMIT 1`,
      [staffNumber],
    );
    return rows[0]?.deactivated === true;
  } catch (error) {
    console.error("Error while checking whether staff is deactivated:", error);
    return false;
  }
}

export async function deleteAdvanceFormSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
