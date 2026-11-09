import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

// The shared secret for the server-to-server /api/staff/* routes, sent in the
// x-staff-lookup-key header. False for every request while the key is unset.
export function hasValidStaffApiKey(request: NextRequest) {
  const expected = process.env.STAFF_LOOKUP_API_KEY;
  const provided = request.headers.get("x-staff-lookup-key");
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
