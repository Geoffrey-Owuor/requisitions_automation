import { headers } from "next/headers";

/**
 * Safely extracts the true request origin behind Nginx or reverse proxies
 */
export async function getRequestOrigin(req: Request): Promise<string> {
  const headersList = await headers();

  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";

  return host ? `${protocol}://${host}` : new URL(req.url).origin;
}
