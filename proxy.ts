import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/session";

// A simple proxy to redirect from designated pages when a valid cookie session is found
const redirectPaths = ["/", "/login", "/guidelines"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fetch session status once per request
  const session = await getSession();

  // 1. HANDLE PROTECTED ROUTE (/dashboard)
  //   Dashboard gracefully handles its own redirect to entra id login
  //   if (pathname.startsWith("/dashboard")) {
  //     if (!session) {
  //       // Cookie is missing or expired -> Force redirect to login
  //       const response = NextResponse.redirect(new URL("/login", request.url));

  //       // Optional: Explicitly wipe the dead cookie if getSession doesn't
  //       response.cookies.delete("requisitions_session");

  //       return response;
  //     }
  //   }

  // 2. HANDLE REDIRECT PAGES (Redirect logged-in users away)
  if (redirectPaths.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Combined matcher to watch both auth flows and the main dashboard
  matcher: ["/", "/guidelines", "/login"],
};
