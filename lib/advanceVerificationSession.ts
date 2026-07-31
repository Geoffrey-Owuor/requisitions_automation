import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET);
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
    .sign(SECRET_KEY);
}

async function decrypt(
  token: string,
): Promise<AdvanceVerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
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
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour, matching the JWT expiration
  });
}

export async function getAdvanceFormSession(): Promise<AdvanceVerificationPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function deleteAdvanceFormSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
