import { NextResponse } from "next/server";

export async function GET() {
  // 1. Grab credentials from environment variables
  const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;
  const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const clientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Entra Id environment variables" },
      { status: 500 },
    );
  }

  // 2. Microsoft Entra ID (Azure AD) token endpoint
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  // 3. Prepare the URL-encoded payload
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    // 4. Request the token
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      // Optional: Prevent Next.js from aggressively caching this fetch
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Token fetch error:", data);
      return NextResponse.json(
        { error: "Failed to fetch access token", details: data },
        { status: response.status },
      );
    }

    // 5. Return the token to the client (or wherever you are calling this from)
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
