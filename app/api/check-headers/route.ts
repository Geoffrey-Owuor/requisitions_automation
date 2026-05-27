// An api route to confirm the headers being passed from nginx
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  // 1. Security Check: Ensure only your script can trigger this
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const headersList = await headers();

  // Convert headers to a plain object for the JSON response
  const responseHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Return it as JSON to the browser
  return NextResponse.json(responseHeaders);
}
