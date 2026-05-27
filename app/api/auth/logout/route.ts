// app/api/auth/logout/route.ts
import { deleteSession } from "@/lib/session";

export async function GET(req: Request) {
  await deleteSession();
  const requestUrl = new URL(req.url);
  return Response.redirect(new URL("/", requestUrl.origin));
}
