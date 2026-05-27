// app/api/auth/callback/route.ts
import { MicrosoftEntraId } from "arctic";
import { cookies } from "next/headers";
import { createSession } from "@/lib/session";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const dynamicRedirectURI = `${requestUrl.origin}/api/auth/callback`;

  const entraId = new MicrosoftEntraId(
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
    dynamicRedirectURI,
  );

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedCodeVerifier = cookieStore.get("oauth_code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response("Invalid OAuth state pairing", { status: 400 });
  }

  try {
    const tokens = await entraId.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    // Fallback checks for handling across Arctic version updates safely
    const accessToken =
      typeof tokens.accessToken === "function"
        ? tokens.accessToken()
        : tokens.accessToken;

    const response = await fetch("https://graph.microsoft.com/oidc/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await response.json();

    // Store user data in the secure cookie using our jose helper
    await createSession({
      name: profile.name || "Microsoft User",
      email: profile.email || profile.preferred_username,
    });

    // Cleanup state tracking cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");

    return Response.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Authentication handshake error:", error);
    return new Response("Authentication failed", { status: 500 });
  }
}
