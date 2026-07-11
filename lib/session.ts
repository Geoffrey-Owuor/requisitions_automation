import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE_NAME = "requisitions_session";

export type SessionPayload = {
  name: string;
  email: string;
};

// 1. Create a signed JWT payload
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Valid for 1 week
    .sign(SECRET_KEY);
}

// 2. Verify and decode the JWT payload
export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
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
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days matching the JWT expiration
  });
}

// 4. Extract user details from active cookie
async function requireSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await decrypt(token);
}

export const getSession = cache(requireSession);

// 5. Delete cookie on logout
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
