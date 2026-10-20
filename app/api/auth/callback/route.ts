// app/api/auth/callback/route.ts
import { MicrosoftEntraId } from "arctic";
import { cookies } from "next/headers";
import { createSession } from "@/lib/session";
import { recordSignIn } from "@/lib/users";
import { getRequestOrigin } from "@/lib/getRequestOrigin";
import {
  fetchMicrosoftProfile,
  isMicrosoftUnreachable,
  retryOnConnectFailure,
} from "@/lib/microsoftSso";

export async function GET(req: Request) {
  const origin = await getRequestOrigin(req);
  const dynamicRedirectURI = `${origin}/api/auth/callback`;

  const entraId = new MicrosoftEntraId(
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
    dynamicRedirectURI,
  );

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedCodeVerifier = cookieStore.get("oauth_code_verifier")?.value;

  // 1. Get the stored return path
  const storedReturnTo =
    cookieStore.get("oauth_return_to")?.value || "/dashboard";

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    // Send the user back to a real page rather than a bare text response.
    return Response.redirect(new URL("/login?error=invalid_state", origin));
  }

  try {
    // Retried once only if the connection to Microsoft never opened - the
    // code is single-use, so anything that may have reached Microsoft isn't.
    const tokens = await retryOnConnectFailure("SSO code exchange", () =>
      entraId.validateAuthorizationCode(code, storedCodeVerifier),
    );

    // Fallback checks for handling across Arctic version updates safely
    const accessToken =
      typeof tokens.accessToken === "function"
        ? tokens.accessToken()
        : tokens.accessToken;

    const profile = await fetchMicrosoftProfile(accessToken as string);
    const email = profile.email || profile.preferred_username;
    if (!email) {
      console.error("Authentication handshake error: profile has no email");
      return Response.redirect(new URL("/login?error=auth_failed", origin));
    }

    // Store user data in the secure cookie using our jose helper
    const name = profile.name || "Microsoft User";
    await createSession({ name, email });
    // So Settings can list and assign roles to everyone who has signed in
    await recordSignIn(email, name);

    // Cleanup state tracking cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");
    cookieStore.delete("oauth_return_to");

    // 3. Security Check: Ensure it's a local relative path to avoid open redirects
    const safeReturnTo =
      storedReturnTo.startsWith("/") && !storedReturnTo.startsWith("//")
        ? storedReturnTo
        : "/dashboard";

    return Response.redirect(new URL(safeReturnTo, origin));
  } catch (error) {
    console.error("Authentication handshake error:", error);
    // Couldn't reach Microsoft at all (network) vs. Microsoft rejected it.
    const reason = isMicrosoftUnreachable(error)
      ? "sso_unreachable"
      : "auth_failed";
    return Response.redirect(new URL(`/login?error=${reason}`, origin));
  }
}
