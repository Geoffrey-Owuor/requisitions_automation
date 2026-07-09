// app/api/auth/login/route.ts
import { MicrosoftEntraId, generateState, generateCodeVerifier } from "arctic";
import { cookies } from "next/headers";
import { getRequestOrigin } from "@/lib/getRequestOrigin";

export async function GET(req: Request) {
  // 1. Get the true origin via our helper
  const origin = await getRequestOrigin(req);
  const dynamicRedirectURI = `${origin}/api/auth/callback`;

  // 1. Extract the returnTo path, default to /dashboard if missing
  const requestUrl = new URL(req.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || "/dashboard";

  // Instantiate Arctic uniquely for the current domain
  const entraId = new MicrosoftEntraId(
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
    dynamicRedirectURI,
  );

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Set temporary tracking cookies for validation step
  cookieStore.set("oauth_state", state, {
    secure: isProd,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set("oauth_code_verifier", codeVerifier, {
    secure: isProd,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
  });

  // 2. Save the return target in a cookie
  cookieStore.set("oauth_return_to", returnTo, {
    secure: isProd,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10, // 10 minutes is plenty
  });

  // FIX: Define the scopes as a flat string array
  const scopes = ["openid", "profile", "email"];

  // FIX: Removed 'await' and passed the 'scopes' array directly as the 3rd argument
  const url = entraId.createAuthorizationURL(state, codeVerifier, scopes);

  return Response.redirect(url);
}
