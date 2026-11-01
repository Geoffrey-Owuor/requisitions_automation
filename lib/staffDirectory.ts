import "server-only";
import type { PoolClient } from "pg";
import { ConfigInputError } from "@/lib/configAdminAccess";

// company_staff_data matching shared by the Staff directory's add/edit form
// and its Excel import (serverActions/StaffDirectoryAdmin.ts,
// app/api/salaryadvance/staff-import). Staff are matched by number (email
// change requests, the staff lookup API) and by email (verification codes),
// so both must stay unique - also among deactivated records, since a "new"
// record over a deactivated one would bring that person back. Staff numbers
// compare ignoring case and surrounding spaces, as the staff lookup API
// (app/api/staff/lookup) reads them, and emails ignoring case. Migration
// 038_staff_directory_unique.sql enforces the same keys in the database.

export const STAFF_NUMBER_KEY_SQL = "UPPER(TRIM(staff_number))";
export const STAFF_EMAIL_KEY_SQL = "LOWER(staff_email)";

export const staffNumberKey = (staffNumber: string) =>
  staffNumber.trim().toUpperCase();

export const STAFF_FIELD_LIMITS = {
  staffNumber: 150,
  name: 255,
  email: 255,
  department: 255,
  location: 255,
} as const;

// Blocks other writers (but not readers) until the transaction ends, so a
// uniqueness check stays true until the insert or update
export async function lockStaffDirectory(client: PoolClient) {
  await client.query(`LOCK TABLE company_staff_data IN SHARE ROW EXCLUSIVE MODE`);
}

// The ConfigInputError message for a record whose staff number or email
// another record (other than `excludeId`) already has, or null
export async function findStaffClash(
  client: PoolClient,
  {
    staffNumber,
    email,
    excludeId = null,
  }: { staffNumber: string; email: string; excludeId?: number | null },
): Promise<string | null> {
  const { rows } = await client.query<{
    staff_number: string;
    email_clash: boolean;
  }>(
    `SELECT staff_number, ${STAFF_EMAIL_KEY_SQL} = $2 AS email_clash
     FROM company_staff_data
     WHERE (${STAFF_NUMBER_KEY_SQL} = $1 OR ${STAFF_EMAIL_KEY_SQL} = $2)
     AND ($3::int IS NULL OR id <> $3)
     ORDER BY email_clash DESC LIMIT 1`,
    [staffNumberKey(staffNumber), email.toLowerCase(), excludeId],
  );
  if (rows.length === 0) return null;
  return rows[0].email_clash
    ? `${email} is already the email of staff number ${rows[0].staff_number}`
    : `Staff number ${rows[0].staff_number} already exists`;
}

export function cleanStaffText(
  value: unknown,
  label: string,
  max: number,
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ConfigInputError(`Enter the ${label}`);
  if (text.length > max) {
    throw new ConfigInputError(
      `The ${label} cannot be longer than ${max} characters`,
    );
  }
  return text;
}
