"use server";
import { query } from "@/lib/db";
import {
  emptyPaginatedResult,
  type PaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import {
  cleanConfigEmail,
  ConfigInputError,
  isConfigId,
  recordConfigChange,
} from "@/lib/configAdminAccess";
import {
  getHrAdvanceSession,
  runHrAdvanceChange,
} from "@/lib/salaryAdvanceAccess";

// The salary advance HR dashboard's Staff directory: company_staff_data,
// which identifies staff for the advance form's email verification and the
// email change requests. It's re-imported periodically from the HR system,
// so edits here are for fixes that can't wait for the next import and are
// lost by it unless also made there. Staff are never deleted here. Changes
// are recorded in config_changes like the Settings page's.

export interface StaffRecord {
  id: number;
  staffNumber: string;
  name: string;
  email: string;
  department: string;
  location: string;
  openRequests: number;
}

export async function getStaffDirectory({
  page = 1,
  pageSize = 10,
  searchTerm,
}: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}): Promise<PaginatedResult<StaffRecord>> {
  if (!(await getHrAdvanceSession()))
    return emptyPaginatedResult(page, pageSize);

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const term = searchTerm?.trim() ? `%${searchTerm.trim()}%` : null;

  const rows = await query<StaffRecord & { total_count: string }>(
    `SELECT s.id, s.staff_number AS "staffNumber", s.staff_name AS name,
     s.staff_email AS email, s.staff_department AS department,
     s.staff_location AS location,
     (SELECT COUNT(*) FROM email_change_requests r
       WHERE r.staff_number = s.staff_number AND r.status = 'open')::int AS "openRequests",
     COUNT(*) OVER() AS total_count
     FROM company_staff_data s
     WHERE $1::text IS NULL OR s.staff_number ILIKE $1 OR s.staff_name ILIKE $1
       OR s.staff_email ILIKE $1 OR s.staff_department ILIKE $1
       OR s.staff_location ILIKE $1
     ORDER BY s.staff_name, s.staff_number
     LIMIT $2 OFFSET $3`,
    [term, limit, offset],
  );
  return toPaginatedResult(rows, page, pageSize);
}

// Existing departments and locations, offered as suggestions
export async function getStaffDirectoryOptions(): Promise<{
  departments: string[];
  locations: string[];
}> {
  if (!(await getHrAdvanceSession())) return { departments: [], locations: [] };
  const [departments, locations] = await Promise.all([
    query<{ value: string }>(
      `SELECT DISTINCT staff_department AS value FROM company_staff_data ORDER BY 1`,
    ),
    query<{ value: string }>(
      `SELECT DISTINCT staff_location AS value FROM company_staff_data ORDER BY 1`,
    ),
  ]);
  return {
    departments: departments.map((row) => row.value),
    locations: locations.map((row) => row.value),
  };
}

function cleanText(value: unknown, label: string, max: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ConfigInputError(`Enter the ${label}`);
  if (text.length > max) {
    throw new ConfigInputError(
      `The ${label} cannot be longer than ${max} characters`,
    );
  }
  return text;
}

// Adds a staff record (no `id`) or updates one
export async function saveStaffRecord(input: {
  id?: unknown;
  staffNumber?: unknown;
  name?: unknown;
  email?: unknown;
  department?: unknown;
  location?: unknown;
}) {
  return runHrAdvanceChange("saving a staff record", async (client, actor) => {
    const isNew = input.id === undefined || input.id === null;
    if (!isNew && !isConfigId(input.id)) {
      throw new ConfigInputError("Choose a staff record");
    }
    const record = {
      staff_number: cleanText(input.staffNumber, "staff number", 150),
      staff_name: cleanText(input.name, "name", 255),
      staff_email: cleanConfigEmail(input.email),
      staff_department: cleanText(input.department, "department", 255),
      staff_location: cleanText(input.location, "location", 255),
    };

    const values = [
      record.staff_number,
      record.staff_name,
      record.staff_email,
      record.staff_department,
      record.staff_location,
    ];

    // Staff are matched by number (email change requests) and by email
    // (verification codes), so both must stay unique
    await client.query(
      `LOCK TABLE company_staff_data IN SHARE ROW EXCLUSIVE MODE`,
    );
    const clash = await client.query<{
      staff_number: string;
      email_clash: boolean;
    }>(
      `SELECT staff_number, LOWER(staff_email) = $2 AS email_clash
       FROM company_staff_data
       WHERE (staff_number = $1 OR LOWER(staff_email) = $2)
       AND ($3::int IS NULL OR id <> $3) LIMIT 1`,
      [record.staff_number, record.staff_email, isNew ? null : input.id],
    );
    if (clash.rows.length > 0) {
      throw new ConfigInputError(
        clash.rows[0].email_clash
          ? `${record.staff_email} is already the email of staff number ${clash.rows[0].staff_number}`
          : `Staff number ${record.staff_number} already exists`,
      );
    }

    if (isNew) {
      const { rows } = await client.query(
        `INSERT INTO company_staff_data
         (staff_number, staff_name, staff_email, staff_department, staff_location)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        values,
      );
      const summary = `Added staff record ${record.staff_name} (${record.staff_number})`;
      await recordConfigChange(client, actor, {
        table: "company_staff_data",
        key: rows[0].id,
        action: "create",
        summary,
        after: record,
      });
      return `${summary}. Add them in the HR system too.`;
    }

    const before = await client.query(
      `SELECT staff_number, staff_name, staff_email, staff_department, staff_location
       FROM company_staff_data WHERE id = $1 FOR UPDATE`,
      [input.id],
    );
    if (before.rows.length === 0) {
      throw new ConfigInputError(
        "That staff record no longer exists - reload to see the latest",
      );
    }
    if (JSON.stringify(before.rows[0]) === JSON.stringify(record)) {
      throw new ConfigInputError("Nothing to change");
    }

    await client.query(
      `UPDATE company_staff_data SET staff_number = $2, staff_name = $3,
       staff_email = $4, staff_department = $5, staff_location = $6
       WHERE id = $1`,
      [input.id, ...values],
    );
    if (before.rows[0].staff_email.toLowerCase() !== record.staff_email) {
      await client.query(
        `UPDATE verification_codes SET consumed = true
         WHERE LOWER(staff_email) = LOWER($1) AND NOT consumed`,
        [before.rows[0].staff_email],
      );
    }

    const summary = `Updated staff record ${record.staff_name} (${record.staff_number})`;
    await recordConfigChange(client, actor, {
      table: "company_staff_data",
      key: input.id as number,
      action: "update",
      summary,
      before: before.rows[0],
      after: record,
    });
    return `${summary}. Make the same change in the HR system, or the next import will undo it.`;
  });
}
