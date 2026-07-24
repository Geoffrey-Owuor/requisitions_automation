import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/session";

// A simple proxy to redirect from designated pages when a valid cookie session is found
const redirectPaths = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Fetch session status once per request
  const session = await getSession();

  // 1. HANDLE PROTECTED ROUTES (/dashboard)
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      // Capture full route (path + query params)
      const returnTo = `${pathname}${search}`;
      loginUrl.searchParams.set("returnTo", returnTo);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("requisitions_session");

      return response;
    }
  }

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
  matcher: ["/", "/login", "/dashboard/:path*"],
};
