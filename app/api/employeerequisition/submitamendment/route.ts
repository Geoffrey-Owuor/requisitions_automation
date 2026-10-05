import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { PoolClient } from "pg";
import { pool, query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { assignedHodNameSql, resolveHod, sameEmail } from "@/lib/hodAssignment";
import {
  writePositionAttachments,
  deleteStoredAttachments,
  StoredAttachment,
} from "@/lib/attachmentStorage";
import {
  PositionInput,
  isEmpty,
  todayIsoDate,
  getPositionError,
  readPositionFiles,
} from "@/lib/employeeRequisitionRules";
import {
  applySubmissionAutoApprovals,
  submissionStage,
} from "@/utils/EmployeeApprovalStages/submissionStage";
import {
  formatSalaryRange,
  parseSalaryRange,
  isEmployeeAmendableHrStatus,
  EmployeeAttachmentType,
  RETAIL_DEPARTMENT,
  MAX_AMENDMENT_REASON_LENGTH,
} from "@/public/assets";

// Amends an employee requisition: the original submitter only, until HR
// approves it. Sent as multipart like the submission - `metadata` JSON plus
// positionFiles_{index}_{type} files. An existing position (one with a
// positionId) keeps every attachment it isn't sent a new file for; a newly
// added position needs all three. Replaced files, and the files of removed
// positions, are moved to employee_requisition_archived_attachments and
// stay on disk for the amendment history. The whole approval chain restarts
// from the HOD stage.

interface AmendmentMetadata {
  requestId: string;
  expectedAmendmentCount: number;
  reason: string;
  department: string;
  hodApprover: string;
  positions: PositionInput[];
}

interface ExistingPositionRow {
  position_id: string;
  position_title: string;
  number_required: number;
  position_replacement_or_new: string;
  position_job_grade: string;
  position_salary_range: string;
  position_justification: string;
  position_reporting_to: string;
  date_filled: string;
}

interface ExistingAttachmentRow {
  attachment_id: string;
  position_id: string;
  attachment_type: EmployeeAttachmentType;
  original_filename: string;
}

// A position's comparable values, in the shape stored on the row
interface PositionValues {
  title: string;
  numberRequired: number;
  replacementOrNew: string;
  jobGrade: string;
  salaryRange: string;
  justification: string;
  reportingTo: string;
  dateFilled: string;
}

interface AttachmentChange {
  attachmentType: EmployeeAttachmentType;
  changeType: "added" | "replaced" | "removed";
  previous: ExistingAttachmentRow | null;
  next: StoredAttachment | null;
}

interface PositionDiff {
  positionId: string;
  positionTitle: string;
  changeType: "added" | "removed" | "modified";
  previous: PositionValues | null;
  next: PositionValues | null;
  attachmentChanges: AttachmentChange[];
}

// The stored salary range is normalised to formatSalaryRange's form so a
// legacy "<min> to <max>" row doesn't register as changed when it wasn't
const normaliseSalaryRange = (value: string) => {
  const parsed = parseSalaryRange(value);
  return parsed ? formatSalaryRange(parsed.min, parsed.max) : value;
};

const rowToValues = (row: ExistingPositionRow): PositionValues => ({
  title: row.position_title,
  numberRequired: row.number_required,
  replacementOrNew: row.position_replacement_or_new,
  jobGrade: row.position_job_grade,
  salaryRange: normaliseSalaryRange(row.position_salary_range),
  justification: row.position_justification,
  reportingTo: row.position_reporting_to,
  dateFilled: row.date_filled,
});

const inputToValues = (position: PositionInput): PositionValues => ({
  title: position.title,
  numberRequired: Number(position.numberRequired),
  replacementOrNew: position.replacementOrNew,
  jobGrade: position.jobGrade,
  salaryRange: formatSalaryRange(
    Number(position.salaryMin),
    Number(position.salaryMax),
  ),
  justification: position.justification,
  reportingTo: position.reportingTo,
  dateFilled: position.dateFilled,
});

const sameValues = (a: PositionValues, b: PositionValues) =>
  (Object.keys(a) as (keyof PositionValues)[]).every((key) => a[key] === b[key]);

export async function POST(request: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  // Files written to disk for this attempt - removed again if it fails
  let storedAttachments: StoredAttachment[] = [];
  let client: PoolClient | undefined;

  try {
    const formData = await request.formData();

    const metadataRaw = formData.get("metadata");
    if (typeof metadataRaw !== "string") {
      return NextResponse.json(
        { message: "Your amendment is missing its form data" },
        { status: 400 },
      );
    }

    const {
      requestId,
      expectedAmendmentCount,
      reason,
      department,
      hodApprover,
      positions,
    } = JSON.parse(metadataRaw) as AmendmentMetadata;

    if (
      !requestId ||
      typeof expectedAmendmentCount !== "number" ||
      typeof reason !== "string" ||
      !reason.trim() ||
      isEmpty(department) ||
      isEmpty(hodApprover)
    ) {
      return NextResponse.json(
        { message: "Your amendment request is missing some required fields" },
        { status: 400 },
      );
    }

    if (reason.trim().length > MAX_AMENDMENT_REASON_LENGTH) {
      return NextResponse.json(
        {
          message: `The amendment reason cannot exceed ${MAX_AMENDMENT_REASON_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        { message: "At least one position is required on this requisition" },
        { status: 400 },
      );
    }

    const today = todayIsoDate();
    const positionFiles: Partial<Record<EmployeeAttachmentType, File>>[] = [];
    const seenPositionIds = new Set<string>();

    for (let index = 0; index < positions.length; index++) {
      const position = positions[index];

      const positionError = getPositionError(position, index, today);
      if (positionError) {
        return NextResponse.json({ message: positionError }, { status: 400 });
      }

      if (position.positionId !== undefined) {
        if (
          typeof position.positionId !== "string" ||
          seenPositionIds.has(position.positionId)
        ) {
          return NextResponse.json(
            { message: `Position ${index + 1} is invalid` },
            { status: 400 },
          );
        }
        seenPositionIds.add(position.positionId);
      }

      // Only a newly added position must come with all three files
      const filesResult = readPositionFiles(
        formData,
        index,
        position.positionId === undefined,
      );
      if (!filesResult.ok) {
        return NextResponse.json(
          { message: filesResult.message },
          { status: 400 },
        );
      }
      positionFiles.push(filesResult.files);
    }

    // Unlocked pre-check before anything is written to disk, so a caller who
    // can't amend this requisition can't make us store files. Everything is
    // re-checked under the row lock below.
    const precheck = await query<{
      submitter_email: string;
      employee_hr_approval_status: string;
      position_ids: string[];
    }>(
      `SELECT r.submitter_email, r.employee_hr_approval_status,
       COALESCE(ARRAY(SELECT position_id::text FROM employee_requisition_positions p
         WHERE p.request_id = r.request_id), '{}') AS position_ids
       FROM employee_requisitions r WHERE r.request_id = $1`,
      [requestId],
    );

    if (
      precheck.length === 0 ||
      !sameEmail(precheck[0].submitter_email, user.email)
    ) {
      return NextResponse.json(
        { message: "You are not authorized to amend this requisition" },
        { status: 403 },
      );
    }

    if (!isEmployeeAmendableHrStatus(precheck[0].employee_hr_approval_status)) {
      return NextResponse.json(
        {
          message:
            "This requisition can no longer be amended - HR has already approved it",
        },
        { status: 409 },
      );
    }

    const precheckPositionIds = new Set(precheck[0].position_ids);
    if ([...seenPositionIds].some((id) => !precheckPositionIds.has(id))) {
      return NextResponse.json(
        {
          message:
            "This requisition was changed since you opened this form - please reopen it and try again",
        },
        { status: 409 },
      );
    }

    // The form sends the HOD's email; the stored name comes from hod_array
    const resolvedHod = await resolveHod(hodApprover);

    if (!resolvedHod) {
      return NextResponse.json(
        {
          message:
            "Could not find the selected HOD approver in current approval workflow, contact the admin for support",
        },
        { status: 404 },
      );
    }

    const { uuid: hodUuid, name: newHodName, email: newHodEmail } = resolvedHod;

    // New positions get their ids now so their files have a final path
    const positionIds = positions.map(
      (position) => position.positionId ?? randomUUID(),
    );

    // --- Write new files to disk first. Each lands in its own
    // per-attachment directory, so nothing existing is overwritten and a
    // failure below only needs these files removed ---
    const storedByPosition: StoredAttachment[][] = [];

    try {
      for (let index = 0; index < positions.length; index++) {
        const stored = await writePositionAttachments(
          requestId,
          positionIds[index],
          positionFiles[index],
        );
        storedAttachments.push(...stored);
        storedByPosition.push(stored);
      }
    } catch (error) {
      console.error(
        "Error while writing employee requisition amendment attachments to disk",
        error,
      );
      await deleteStoredAttachments(storedAttachments);
      storedAttachments = [];
      return NextResponse.json(
        { message: "An error occurred while trying to save your attachments" },
        { status: 500 },
      );
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: headerRows } = await client.query(
      `SELECT submitter_email, employee_department, employee_hod_email,
       employee_hod_approver, amendment_count,
       ${assignedHodNameSql("employee_hod_email", "employee_hod_approver")} AS assigned_hod_name,
       employee_hod_approval_status, employee_hod_comments, employee_hod_approval_date,
       employee_retail_director_approval_status, employee_retail_director_approver,
       employee_retail_director_comments, employee_retail_director_approval_date,
       employee_director_approval_status, employee_director_approver,
       employee_director_comments, employee_director_approval_date,
       employee_hr_approval_status, employee_hr_approver,
       employee_hr_comments, employee_hr_approval_date
       FROM employee_requisitions WHERE request_id = $1 FOR UPDATE`,
      [requestId],
    );

    const rejectWith = async (message: string, status: number) => {
      await client!.query("ROLLBACK");
      await deleteStoredAttachments(storedAttachments);
      storedAttachments = [];
      return NextResponse.json({ message }, { status });
    };

    if (headerRows.length === 0) {
      return rejectWith("The selected requisition could not be found", 404);
    }

    const header = headerRows[0];

    if (!sameEmail(header.submitter_email, user.email)) {
      return rejectWith("You are not authorized to amend this requisition", 403);
    }

    if (!isEmployeeAmendableHrStatus(header.employee_hr_approval_status)) {
      return rejectWith(
        "This requisition can no longer be amended - HR has already approved it",
        409,
      );
    }

    if (header.amendment_count !== expectedAmendmentCount) {
      return rejectWith(
        "This requisition was amended since you opened this form - please reopen it and try again",
        409,
      );
    }

    const { rows: existingPositions } =
      await client.query<ExistingPositionRow>(
        `SELECT position_id, position_title, number_required,
         position_replacement_or_new, position_job_grade, position_salary_range,
         position_justification, position_reporting_to,
         TO_CHAR(date_position_filled, 'YYYY-MM-DD') AS date_filled
         FROM employee_requisition_positions WHERE request_id = $1 FOR UPDATE`,
        [requestId],
      );

    const { rows: existingAttachments } =
      await client.query<ExistingAttachmentRow>(
        `SELECT attachment_id, position_id, attachment_type, original_filename
         FROM employee_requisition_attachments WHERE request_id = $1 FOR UPDATE`,
        [requestId],
      );

    const existingById = new Map(
      existingPositions.map((position) => [position.position_id, position]),
    );

    if ([...seenPositionIds].some((id) => !existingById.has(id))) {
      return rejectWith(
        "This requisition was changed since you opened this form - please reopen it and try again",
        409,
      );
    }

    const attachmentsByPosition = new Map<string, ExistingAttachmentRow[]>();
    for (const attachment of existingAttachments) {
      const list = attachmentsByPosition.get(attachment.position_id) ?? [];
      list.push(attachment);
      attachmentsByPosition.set(attachment.position_id, list);
    }

    // ---- Header diff ----
    const departmentChanged = department !== header.employee_department;
    const hodChanged = !sameEmail(newHodEmail, header.employee_hod_email);

    // ---- Position diff (matched by position_id) ----
    const positionDiffs: PositionDiff[] = [];

    for (const existing of existingPositions) {
      if (seenPositionIds.has(existing.position_id)) continue;

      positionDiffs.push({
        positionId: existing.position_id,
        positionTitle: existing.position_title,
        changeType: "removed",
        previous: rowToValues(existing),
        next: null,
        attachmentChanges: (
          attachmentsByPosition.get(existing.position_id) ?? []
        ).map((attachment) => ({
          attachmentType: attachment.attachment_type,
          changeType: "removed",
          previous: attachment,
          next: null,
        })),
      });
    }

    positions.forEach((position, index) => {
      const next = inputToValues(position);
      const stored = storedByPosition[index];

      if (position.positionId === undefined) {
        positionDiffs.push({
          positionId: positionIds[index],
          positionTitle: next.title,
          changeType: "added",
          previous: null,
          next,
          attachmentChanges: stored.map((attachment) => ({
            attachmentType: attachment.attachmentType,
            changeType: "added",
            previous: null,
            next: attachment,
          })),
        });
        return;
      }

      const existing = existingById.get(position.positionId)!;
      const previous = rowToValues(existing);
      const currentAttachments =
        attachmentsByPosition.get(position.positionId) ?? [];

      const attachmentChanges: AttachmentChange[] = stored.map(
        (attachment) => {
          const replaced =
            currentAttachments.find(
              (current) => current.attachment_type === attachment.attachmentType,
            ) ?? null;
          return {
            attachmentType: attachment.attachmentType,
            // Every existing position has all three types, so a file sent
            // for one always replaces - "added" only covers a missing slot
            changeType: replaced ? "replaced" : "added",
            previous: replaced,
            next: attachment,
          };
        },
      );

      if (sameValues(previous, next) && attachmentChanges.length === 0) return;

      positionDiffs.push({
        positionId: position.positionId,
        positionTitle: next.title,
        changeType: "modified",
        previous,
        next,
        attachmentChanges,
      });
    });

    if (!departmentChanged && !hodChanged && positionDiffs.length === 0) {
      return rejectWith("No changes were detected - nothing to amend", 400);
    }

    const amendmentNumber = header.amendment_count + 1;

    // Record the amendment - the header/position diffs and a snapshot of the
    // approval state this amendment is about to reset
    const { rows: insertedAmendment } = await client.query(
      `INSERT INTO employee_requisition_amendments
       (request_id, amendment_number, amended_by_email, amended_by_name, amendment_reason,
        previous_department, new_department, previous_hod_approver, new_hod_approver,
        previous_total_positions, new_total_positions,
        previous_total_required, new_total_required,
        nullified_hod_status, nullified_hod_approver, nullified_hod_comments, nullified_hod_date,
        nullified_retail_director_status, nullified_retail_director_approver,
        nullified_retail_director_comments, nullified_retail_director_date,
        nullified_director_status, nullified_director_approver,
        nullified_director_comments, nullified_director_date,
        nullified_hr_status, nullified_hr_approver, nullified_hr_comments, nullified_hr_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
               $21,$22,$23,$24,$25,$26,$27,$28,$29)
       RETURNING amendment_id`,
      [
        requestId,
        amendmentNumber,
        user.email,
        user.name,
        reason.trim(),
        departmentChanged ? header.employee_department : null,
        departmentChanged ? department : null,
        // employee_hod_approver holds whoever acted on the HOD stage
        // (possibly an alternate), so the previous name is the ASSIGNED
        // HOD's. The nullified snapshot keeps the actual approver's name.
        hodChanged ? header.assigned_hod_name : null,
        hodChanged ? newHodName : null,
        existingPositions.length,
        positions.length,
        existingPositions.reduce((sum, p) => sum + p.number_required, 0),
        positions.reduce((sum, p) => sum + Number(p.numberRequired), 0),
        header.employee_hod_approval_status,
        header.employee_hod_approver,
        header.employee_hod_comments,
        header.employee_hod_approval_date,
        header.employee_retail_director_approval_status,
        header.employee_retail_director_approver,
        header.employee_retail_director_comments,
        header.employee_retail_director_approval_date,
        header.employee_director_approval_status,
        header.employee_director_approver,
        header.employee_director_comments,
        header.employee_director_approval_date,
        header.employee_hr_approval_status,
        header.employee_hr_approver,
        header.employee_hr_comments,
        header.employee_hr_approval_date,
      ],
    );

    const amendmentId: string = insertedAmendment[0].amendment_id;

    // One history row per changed position, plus its attachment changes.
    // Written while the position row exists: before removed positions are
    // deleted (the FK then nulls itself), after added ones are inserted.
    const insertPositionHistory = async (diff: PositionDiff) => {
      const { rows: insertedPosition } = await client!.query(
        `INSERT INTO employee_requisition_amendment_positions
         (amendment_id, position_id, position_title, change_type,
          previous_title, new_title, previous_number_required, new_number_required,
          previous_replacement_or_new, new_replacement_or_new,
          previous_job_grade, new_job_grade, previous_salary_range, new_salary_range,
          previous_justification, new_justification,
          previous_reporting_to, new_reporting_to,
          previous_date_filled, new_date_filled)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING amendment_position_id`,
        [
          amendmentId,
          diff.positionId,
          diff.positionTitle,
          diff.changeType,
          diff.previous?.title ?? null,
          diff.next?.title ?? null,
          diff.previous?.numberRequired ?? null,
          diff.next?.numberRequired ?? null,
          diff.previous?.replacementOrNew ?? null,
          diff.next?.replacementOrNew ?? null,
          diff.previous?.jobGrade ?? null,
          diff.next?.jobGrade ?? null,
          diff.previous?.salaryRange ?? null,
          diff.next?.salaryRange ?? null,
          diff.previous?.justification ?? null,
          diff.next?.justification ?? null,
          diff.previous?.reportingTo ?? null,
          diff.next?.reportingTo ?? null,
          diff.previous?.dateFilled ?? null,
          diff.next?.dateFilled ?? null,
        ],
      );

      const amendmentPositionId: string =
        insertedPosition[0].amendment_position_id;

      for (const change of diff.attachmentChanges) {
        await client!.query(
          `INSERT INTO employee_requisition_amendment_attachments
           (amendment_position_id, attachment_type, change_type,
            previous_attachment_id, previous_filename, new_attachment_id, new_filename)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            amendmentPositionId,
            change.attachmentType,
            change.changeType,
            change.previous?.attachment_id ?? null,
            change.previous?.original_filename ?? null,
            change.next?.attachmentId ?? null,
            change.next?.originalFilename ?? null,
          ],
        );
      }
    };

    for (const diff of positionDiffs) {
      if (diff.changeType !== "added") await insertPositionHistory(diff);
    }

    // Archive every replaced file and every file of a removed position,
    // under the position's title as it was before this amendment. The files
    // themselves stay on disk.
    const archivedIds = positionDiffs.flatMap((diff) =>
      diff.attachmentChanges
        .filter((change) => change.previous)
        .map((change) => change.previous!.attachment_id),
    );

    if (archivedIds.length > 0) {
      await client.query(
        `INSERT INTO employee_requisition_archived_attachments
         (attachment_id, request_id, amendment_id, position_id, position_title,
          attachment_type, original_filename, stored_filename, file_path,
          mime_type, file_size_bytes, uploaded_at)
         SELECT a.attachment_id, a.request_id, $1, a.position_id, p.position_title,
          a.attachment_type, a.original_filename, a.stored_filename, a.file_path,
          a.mime_type, a.file_size_bytes, a.created_at
         FROM employee_requisition_attachments a
         JOIN employee_requisition_positions p ON p.position_id = a.position_id
         WHERE a.attachment_id = ANY($2)`,
        [amendmentId, archivedIds],
      );

      await client.query(
        `DELETE FROM employee_requisition_attachments WHERE attachment_id = ANY($1)`,
        [archivedIds],
      );
    }

    // Apply the amended header, and reset the approval chain to defaults.
    // Retail Director applies only to a retail department (which an
    // amendment may have changed).
    await client.query(
      `UPDATE employee_requisitions
       SET employee_department = $1,
       employee_hod_approver = $2, employee_hod_email = $3,
       employee_hod_approval_status = 'pending', employee_hod_comments = NULL,
       employee_hod_approval_date = NULL, employee_hod_actioned_by_email = NULL,
       employee_retail_director_approval_status = $4,
       employee_retail_director_approver = NULL, employee_retail_director_email = NULL,
       employee_retail_director_comments = NULL, employee_retail_director_approval_date = NULL,
       employee_director_approval_status = 'pending',
       employee_director_approver = NULL, employee_director_email = NULL,
       employee_director_comments = NULL, employee_director_approval_date = NULL,
       employee_hr_approval_status = 'pending',
       employee_hr_approver = NULL, employee_hr_email = NULL,
       employee_hr_comments = NULL, employee_hr_approval_date = NULL,
       amendment_count = $5, last_amended_at = CURRENT_TIMESTAMP
       WHERE request_id = $6`,
      [
        department,
        newHodName,
        newHodEmail,
        department === RETAIL_DEPARTMENT ? "pending" : "N/A",
        amendmentNumber,
        requestId,
      ],
    );

    // Removed positions (their attachments were archived above)
    const removedIds = positionDiffs
      .filter((diff) => diff.changeType === "removed")
      .map((diff) => diff.positionId);

    if (removedIds.length > 0) {
      await client.query(
        `DELETE FROM employee_requisition_positions WHERE position_id = ANY($1)`,
        [removedIds],
      );
    }

    for (const diff of positionDiffs) {
      if (diff.changeType === "removed") continue;

      const next = diff.next!;
      const values = [
        diff.positionId,
        next.title,
        next.numberRequired,
        next.justification,
        next.reportingTo,
        next.dateFilled,
        next.replacementOrNew,
        next.jobGrade,
        next.salaryRange,
      ];

      if (diff.changeType === "added") {
        await client.query(
          `INSERT INTO employee_requisition_positions
           (position_id, request_id, position_title, number_required,
            position_justification, position_reporting_to, date_position_filled,
            position_replacement_or_new, position_job_grade, position_salary_range)
           VALUES ($1, $10, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [...values, requestId],
        );

        await insertPositionHistory(diff);
      } else {
        await client.query(
          `UPDATE employee_requisition_positions
           SET position_title = $2, number_required = $3,
           position_justification = $4, position_reporting_to = $5,
           date_position_filled = $6, position_replacement_or_new = $7,
           position_job_grade = $8, position_salary_range = $9
           WHERE position_id = $1`,
          values,
        );
      }
    }

    // New attachment rows - replacements and added positions' files
    for (const diff of positionDiffs) {
      for (const change of diff.attachmentChanges) {
        if (!change.next) continue;

        await client.query(
          `INSERT INTO employee_requisition_attachments
           (attachment_id, position_id, request_id, original_filename,
            stored_filename, file_path, mime_type, file_size_bytes, attachment_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            change.next.attachmentId,
            diff.positionId,
            requestId,
            change.next.originalFilename,
            change.next.storedFilename,
            change.next.filePath,
            change.next.mimeType,
            change.next.fileSizeBytes,
            change.next.attachmentType,
          ],
        );
      }
    }

    // Reproduce the self-HOD auto-approvals from the initial submission
    const firstPendingStage = await applySubmissionAutoApprovals(client, {
      requestId,
      department,
      submitterEmail: user.email,
      submitterName: user.name,
      hodEmail: newHodEmail,
    });

    await client.query("COMMIT");
    // Committed - the new files are now referenced and must be kept
    storedAttachments = [];

    submissionStage({
      requestId,
      submitterEmail: user.email,
      hodEmail: newHodEmail,
      hodUuid,
      firstPendingStage,
      amenderName: user.name,
    });

    return NextResponse.json(
      {
        message:
          "Your amendment has been submitted successfully, the approval workflow has restarted",
      },
      { status: 200 },
    );
  } catch (error) {
    await client?.query("ROLLBACK");
    await deleteStoredAttachments(storedAttachments);
    console.error(
      "Error while trying to submit the employee requisition amendment",
      error,
    );
    return NextResponse.json(
      { message: "An error occurred while trying to submit this amendment" },
      { status: 500 },
    );
  } finally {
    client?.release();
  }
}
