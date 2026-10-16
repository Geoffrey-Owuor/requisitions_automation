import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/session";

// Signs the SSO hand-off for an embedded app at the moment the iframe
// requests it, then redirects the iframe there. The dashboard embedding pages
// point their iframe here instead of rendering a signed URL into the page:
// the client router reuses an already-rendered page on back/forward
// navigation, which would replay a timestamp past the embedded apps'
// 2-minute window.
type EmbeddedApp = {
  // SSO entry point behind Nginx, on the same origin the user is browsing
  ssoPath: string;
  fallbackHost: string;
  // Each embedded app verifies its own signing format - keep these in sync
  sign: (email: string, name: string, timestamp: string) => string;
  includeName: boolean;
};

const EMBEDDED_APPS: Record<string, EmbeddedApp> = {
  helpdesk: {
    ssoPath: "/helpdesk/api/sso/external",
    fallbackHost: "127.0.0.1:5005",
    // name is signed too - HelpDesk uses it to seed a new user's
    // registration. JSON-encoded so a ":" in any field can't shift the
    // field boundaries.
    sign: (email, name, timestamp) => JSON.stringify([email, name, timestamp]),
    includeName: true,
  },
  staffproductpurchase: {
    ssoPath: "/staffproductpurchase/api/external/sso",
    fallbackHost: "127.0.0.1:4000",
    sign: (email, _name, timestamp) => `${email}:${timestamp}`,
    includeName: false,
  },
};

const noStore = { "Cache-Control": "no-store" };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> },
) {
  const { app } = await params;
  const embeddedApp = Object.hasOwn(EMBEDDED_APPS, app)
    ? EMBEDDED_APPS[app]
    : undefined;

  if (!embeddedApp) {
    return new NextResponse("Unknown app", { status: 404, headers: noStore });
  }

  // The embedding page already gates on the session; this only trips if it
  // expired in between. Don't redirect to the Entra sign-in - Microsoft
  // refuses to render inside an iframe.
  const session = await getSession();
  if (!session) {
    return new NextResponse("Your session has expired. Refresh the page.", {
      status: 401,
      headers: noStore,
    });
  }

  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret) {
    console.error("SSO_SHARED_SECRET is not set - cannot sign embed SSO URL");
    return new NextResponse("Embedded sign-in is not configured", {
      status: 500,
      headers: noStore,
    });
  }

  // Inspect headers sent by Nginx, falling back to local headers if accessed directly
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    embeddedApp.fallbackHost;

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(embeddedApp.sign(session.email, session.name, timestamp))
    .digest("hex");

  const ssoUrl = new URL(embeddedApp.ssoPath, `${proto}://${host}`);
  ssoUrl.searchParams.set("email", session.email);
  if (embeddedApp.includeName) ssoUrl.searchParams.set("name", session.name);
  ssoUrl.searchParams.set("timestamp", timestamp);
  ssoUrl.searchParams.set("signature", signature);

  // no-store so neither the browser nor a proxy can hand back an old
  // redirect (and with it an expired timestamp)
  return NextResponse.redirect(ssoUrl, { headers: noStore });
}
