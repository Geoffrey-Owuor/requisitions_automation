"use server";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import {
  emptyPaginatedResult,
  type PaginatedResult,
  toPaginatedResult,
  toSafeOffsetLimit,
} from "@/lib/pagination";
import { ConfigInputError, isConfigId } from "@/lib/configAdminAccess";
import {
  getHrAdvanceSession,
  runHrAdvanceChange,
} from "@/lib/salaryAdvanceAccess";
import { EmailChangeResolutionEmailSender } from "@/services/EmailChangeRequestEmailSender";

// HR's side of the public "Request an email change" form (migrations 015,
// 030), for the hr-advance role on the salary advance HR dashboard.
// Requests are unverified, so HR confirms the requester's identity out of
// band first. "Approve & apply" changes company_staff_data.staff_email in
// the same transaction that resolves the request; "Reject" changes nothing.
// Both are final. company_staff_data is re-imported periodically, so an
// approved change must also be made in the HR system.

export type EmailChangeStatus = "open" | "approved" | "rejected";

export interface EmailChangeRequestRow {
  id: number;
  staffNumber: string;
  staffName: string;
  department: string;
  reason: string;
  requestedEmail: string;
  staffFound: boolean;
  status: EmailChangeStatus;
  submittedAt: string;
  // Live from company_staff_data (null when the staff number isn't there)
  currentName: string | null;
  currentDepartment: string | null;
  currentEmail: string | null;
  // Another staff record already using the requested address
  emailUsedBy: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  resolutionNote: string | null;
  previousEmail: string | null;
}

const STATUSES: EmailChangeStatus[] = ["open", "approved", "rejected"];
const NOTE_MAX_LENGTH = 500;
const DATE_FORMAT = `'DD Mon YYYY, HH24:MI'`;

export async function getEmailChangeRequests({
  status = "open",
  page = 1,
  pageSize = 10,
  searchTerm,
}: {
  status?: EmailChangeStatus;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}): Promise<PaginatedResult<EmailChangeRequestRow>> {
  if (!(await getHrAdvanceSession()) || !STATUSES.includes(status)) {
    return emptyPaginatedResult(page, pageSize);
  }

  const { limit, offset } = toSafeOffsetLimit({ page, pageSize });
  const term = searchTerm?.trim() ? `%${searchTerm.trim()}%` : null;

  const rows = await query<EmailChangeRequestRow & { total_count: string }>(
    `SELECT r.id, r.staff_number AS "staffNumber", r.staff_name AS "staffName",
     r.department, r.reason, r.requested_email AS "requestedEmail",
     r.staff_found AS "staffFound", r.status,
     TO_CHAR(r.created_at AT TIME ZONE 'Africa/Nairobi', ${DATE_FORMAT}) AS "submittedAt",
     s.staff_name AS "currentName", s.staff_department AS "currentDepartment",
     s.staff_email AS "currentEmail",
     (SELECT o.staff_name || ' (' || o.staff_number || ')' FROM company_staff_data o
       WHERE LOWER(o.staff_email) = LOWER(r.requested_email)
       AND o.staff_number <> r.staff_number LIMIT 1) AS "emailUsedBy",
     TO_CHAR(r.resolved_at AT TIME ZONE 'Africa/Nairobi', ${DATE_FORMAT}) AS "resolvedAt",
     r.resolved_by_name AS "resolvedByName", r.resolution_note AS "resolutionNote",
     r.previous_email AS "previousEmail",
     COUNT(*) OVER() AS total_count
     FROM email_change_requests r
     LEFT JOIN LATERAL (
       SELECT staff_name, staff_department, staff_email FROM company_staff_data
       WHERE staff_number = r.staff_number ORDER BY id LIMIT 1
     ) s ON true
     WHERE r.status = $1
     AND ($2::text IS NULL OR r.staff_number ILIKE $2 OR r.staff_name ILIKE $2
       OR r.requested_email ILIKE $2 OR r.department ILIKE $2)
     ORDER BY ${status === "open" ? "r.created_at ASC" : "r.resolved_at DESC"}, r.id
     LIMIT $3 OFFSET $4`,
    [status, term, limit, offset],
  );
  return toPaginatedResult(rows, page, pageSize);
}

export async function getEmailChangeRequestCounts(): Promise<
  Record<EmailChangeStatus, number>
> {
  const counts = { open: 0, approved: 0, rejected: 0 };
  if (!(await getHrAdvanceSession())) return counts;

  const rows = await query<{ status: EmailChangeStatus; count: string }>(
    `SELECT status, COUNT(*) AS count FROM email_change_requests GROUP BY status`,
  );
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

function cleanNote(value: unknown, required: boolean): string | null {
  const note = typeof value === "string" ? value.trim() : "";
  if (!note) {
    if (required) throw new ConfigInputError("Give a reason for rejecting it");
    return null;
  }
  if (note.length > NOTE_MAX_LENGTH) {
    throw new ConfigInputError(
      `A note cannot be longer than ${NOTE_MAX_LENGTH} characters`,
    );
  }
  return note;
}

// The open request `id`, locked, or a ConfigInputError
async function lockOpenRequest(client: PoolClient, id: unknown) {
  if (!isConfigId(id)) throw new ConfigInputError("Choose a request");
  const { rows } = await client.query<{
    id: number;
    staff_number: string;
    staff_name: string;
    requested_email: string;
    status: EmailChangeStatus;
  }>(
    `SELECT id, staff_number, staff_name, requested_email, status
     FROM email_change_requests WHERE id = $1 FOR UPDATE`,
    [id],
  );
  if (rows.length === 0)
    throw new ConfigInputError("That request no longer exists");
  if (rows[0].status !== "open") {
    throw new ConfigInputError(
      `That request was already ${rows[0].status} - reload to see the latest`,
    );
  }
  return rows[0];
}

export async function approveEmailChangeRequest(id: unknown, note: unknown) {
  // Filled in by the transaction, for the emails sent once it commits
  const outcome: {
    applied?: {
      staffName: string;
      requestedEmail: string;
      previousEmail: string;
    };
  } = {};

  const result = await runHrAdvanceChange(
    "approving an email change request",
    async (client, actor) => {
      const request = await lockOpenRequest(client, id);
      const resolutionNote = cleanNote(note, false);
      const requestedEmail = request.requested_email.trim().toLowerCase();

      const staff = await client.query<{
        id: number;
        staff_name: string;
        staff_email: string;
      }>(
        `SELECT id, staff_name, staff_email FROM company_staff_data
         WHERE staff_number = $1 FOR UPDATE`,
        [request.staff_number],
      );
      if (staff.rows.length === 0) {
        throw new ConfigInputError(
          `Staff number ${request.staff_number} isn't in the staff records - add it in the Staff directory first, or reject the request`,
        );
      }
      if (staff.rows.length > 1) {
        throw new ConfigInputError(
          `Staff number ${request.staff_number} appears on more than one staff record - fix the staff data first`,
        );
      }
      const record = staff.rows[0];

      // Verification codes are looked up by email, so it must stay unique
      const taken = await client.query(
        `SELECT staff_number FROM company_staff_data
         WHERE LOWER(staff_email) = $1 AND id <> $2 LIMIT 1`,
        [requestedEmail, record.id],
      );
      if (taken.rows.length > 0) {
        throw new ConfigInputError(
          `${requestedEmail} is already the email of staff number ${taken.rows[0].staff_number}`,
        );
      }

      await client.query(
        `UPDATE company_staff_data SET staff_email = $2 WHERE id = $1`,
        [record.id, requestedEmail],
      );
      // Unused codes sent to the replaced address stop working
      await client.query(
        `UPDATE verification_codes SET consumed = true
         WHERE LOWER(staff_email) = LOWER($1) AND NOT consumed`,
        [record.staff_email],
      );
      await client.query(
        `UPDATE email_change_requests
         SET status = 'approved', resolved_at = NOW(), resolved_by = $2,
         resolved_by_name = $3, resolution_note = $4, previous_email = $5
         WHERE id = $1`,
        [
          request.id,
          actor.email,
          actor.name,
          resolutionNote,
          record.staff_email,
        ],
      );

      outcome.applied = {
        staffName: record.staff_name,
        requestedEmail,
        previousEmail: record.staff_email,
      };
      return `Changed ${record.staff_name}'s email to ${requestedEmail}. Remember to update it in the HR system too, or the next staff import will undo it.`;
    },
  );

  const { applied } = outcome;
  if (!result.ok || !applied) return result;

  const sent = await EmailChangeResolutionEmailSender("approved", applied);
  return sent.success
    ? result
    : {
        ok: true,
        message: `${result.message} The confirmation email to ${applied.requestedEmail} could not be sent.`,
      };
}

export async function rejectEmailChangeRequest(id: unknown, note: unknown) {
  const outcome: { rejected?: { staffName: string; requestedEmail: string } } =
    {};

  const result = await runHrAdvanceChange(
    "rejecting an email change request",
    async (client, actor) => {
      const request = await lockOpenRequest(client, id);
      const resolutionNote = cleanNote(note, true);

      await client.query(
        `UPDATE email_change_requests
         SET status = 'rejected', resolved_at = NOW(), resolved_by = $2,
         resolved_by_name = $3, resolution_note = $4
         WHERE id = $1`,
        [request.id, actor.email, actor.name, resolutionNote],
      );

      outcome.rejected = {
        staffName: request.staff_name,
        requestedEmail: request.requested_email,
      };
      return `Rejected the request for ${request.staff_name} (${request.staff_number})`;
    },
  );

  const { rejected } = outcome;
  if (!result.ok || !rejected) return result;

  const sent = await EmailChangeResolutionEmailSender("rejected", rejected);
  return sent.success
    ? result
    : {
        ok: true,
        message: `${result.message}. The email to the requester could not be sent.`,
      };
}
