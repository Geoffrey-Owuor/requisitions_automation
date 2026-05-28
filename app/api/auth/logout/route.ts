// app/api/auth/logout/route.ts
import { deleteSession } from "@/lib/session";
import { getRequestOrigin } from "@/lib/getRequestOrigin";

export async function GET(req: Request) {
  // 1. Destroy the jose JWT session cookie
  await deleteSession();

  // 2. Get the true origin via our helper
  const origin = await getRequestOrigin(req);

  // 3. Safely redirect back to the public homepage on the correct domain
  return Response.redirect(new URL("/", origin));
}
