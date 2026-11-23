import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { config } from "@/lib/config";
import { cache } from "react";
import { isUserDeactivated } from "@/lib/users";

// Read on use: a missing SESSION_SECRET throws a named error from the call
// that needs it, outside decrypt's catch so it isn't mistaken for a bad token
function secretKey() {
  return new TextEncoder().encode(config.sessionSecret);
}
const COOKIE_NAME = "requisitions_session";

export type SessionPayload = {
  name: string;
  email: string;
};

// Emails are stored and compared lowercase everywhere (migration
// 020_lowercase_emails.sql) - Entra may return any casing for a mailbox.
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// 1. Create a signed JWT payload
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, email: normalizeEmail(payload.email) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Valid for 1 week
    .sign(secretKey());
}

// 2. Verify and decode the JWT payload
export async function decrypt(token: string): Promise<SessionPayload | null> {
  const key = secretKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    const session = payload as SessionPayload;
    // Sessions issued before emails were normalized may carry mixed case
    return { ...session, email: normalizeEmail(session.email) };
  } catch {
    return null; // Invalid token or expired
  }
}

// 3. Set the encrypted cookie on the response
export async function createSession(user: SessionPayload) {
  const token = await encrypt(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days matching the JWT expiration
  });
}

// 4. Extract user details from active cookie. The JWT alone would stay valid
// for 7 days, so a deactivated account (migration 031) is also refused here -
// every gate (proxy, layouts, API routes, server actions) goes through this.
async function requireSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await decrypt(token);
  if (!session || (await isUserDeactivated(session.email))) return null;
  return session;
}

export const getSession = cache(requireSession);

// 5. Delete cookie on logout
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
