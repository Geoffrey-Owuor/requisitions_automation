// An api route to confirm the headers being passed from nginx

import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const headersList = await headers();

  // Convert headers to a plain object for the JSON response
  const responseHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Return it as JSON to the browser
  return NextResponse.json(responseHeaders);
}
