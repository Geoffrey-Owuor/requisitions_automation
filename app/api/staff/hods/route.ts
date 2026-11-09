// Server-to-server list of HODs for other internal apps (today the IT Asset
// Manager's "Approved By" dropdown on equipment issue forms). Gated by the
// STAFF_LOOKUP_API_KEY shared secret in the x-staff-lookup-key header, never
// by a session - it must not be called from a browser.
//
// GET -> { hods: [{ name, email, department }] }
// Alternate-only HODs are left out, matching the submission dropdown
// (lib/loadAppDataV2.ts).
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hasValidStaffApiKey } from "@/lib/staffApiKey";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  if (!hasValidStaffApiKey(request)) {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403, headers: noStore },
    );
  }

  try {
    const hods = await query<{
      name: string;
      email: string;
      department: string | null;
    }>(
      `SELECT hod_name AS name, hod_email AS email, hod_department AS department
       FROM hod_array
       WHERE is_alternate_only = false
       ORDER BY hod_name`,
    );
    return NextResponse.json({ hods }, { headers: noStore });
  } catch (error) {
    console.error("Error while listing HODs:", error);
    return NextResponse.json(
      { message: "The HOD list is unavailable" },
      { status: 503, headers: noStore },
    );
  }
}
