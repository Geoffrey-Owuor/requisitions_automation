import { NextRequest } from "next/server";
import { config, secretMatches } from "@/lib/config";

// The shared secret for the server-to-server /api/staff/* routes, sent in the
// x-staff-lookup-key header. False for every request while the key is unset.
export function hasValidStaffApiKey(request: NextRequest) {
  return secretMatches(
    request.headers.get("x-staff-lookup-key"),
    config.secrets.staffLookupApiKey,
  );
}
