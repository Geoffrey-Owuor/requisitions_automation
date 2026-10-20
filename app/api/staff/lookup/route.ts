// Server-to-server staff lookup for other internal apps (today Staff
// Product Purchase, which checks registrations and sign-ins against
// company_staff_data). Gated by the STAFF_LOOKUP_API_KEY shared secret in
// the x-staff-lookup-key header, never by a session - it must not be
// called from a browser. It refuses every request while the key is unset.
//
// POST { email } or { staffNumber } ->
//   { found: false } or
//   { found: true, active, staff: { staffNumber, name, department } }
// The record's email is never returned: a caller looking up by staff number
// must not learn the personal email on file.
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { query } from "@/lib/db";

const noStore = { "Cache-Control": "no-store" };

function hasValidKey(request: NextRequest) {
  const expected = process.env.STAFF_LOOKUP_API_KEY;
  const provided = request.headers.get("x-staff-lookup-key");
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const clean = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() && value.trim().length <= max
    ? value.trim()
    : null;

export async function POST(request: NextRequest) {
  if (!process.env.STAFF_LOOKUP_API_KEY) {
    console.error("STAFF_LOOKUP_API_KEY is not set - refusing staff lookups");
  }
  if (!hasValidKey(request)) {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403, headers: noStore },
    );
  }

  let body: { email?: unknown; staffNumber?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const email = clean(body.email, 255)?.toLowerCase() ?? null;
  const staffNumber = clean(body.staffNumber, 150);
  if (!email === !staffNumber) {
    return NextResponse.json(
      { message: "Send either an email or a staff number" },
      { status: 400, headers: noStore },
    );
  }

  try {
    // Staff numbers are compared ignoring case and surrounding spaces, as
    // people type them by hand on the other side
    const rows = await query<{
      staffNumber: string;
      name: string;
      department: string;
      active: boolean;
    }>(
      `SELECT staff_number AS "staffNumber", staff_name AS name,
       staff_department AS department, deactivated_at IS NULL AS active
       FROM company_staff_data
       WHERE ${email ? "LOWER(staff_email) = $1" : "UPPER(TRIM(staff_number)) = UPPER($1)"}
       ORDER BY id LIMIT 1`,
      [email ?? staffNumber],
    );

    if (rows.length === 0) {
      return NextResponse.json({ found: false }, { headers: noStore });
    }
    const { active, ...staff } = rows[0];
    return NextResponse.json(
      { found: true, active, staff },
      { headers: noStore },
    );
  } catch (error) {
    console.error("Error while looking up a staff record:", error);
    return NextResponse.json(
      { message: "The staff directory is unavailable" },
      { status: 503, headers: noStore },
    );
  }
}
