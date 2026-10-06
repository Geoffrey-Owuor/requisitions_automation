import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { resolveHod } from "@/lib/hodAssignment";
import {
  writePositionAttachments,
  deleteRequisitionDirectory,
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
  EmployeeFirstPendingStage,
} from "@/utils/EmployeeApprovalStages/submissionStage";
import {
  formatSalaryRange,
  EmployeeAttachmentType,
  RETAIL_DEPARTMENT,
} from "@/public/assets";

export async function POST(request: NextRequest) {
  // Check if we have a valid session
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  const { name, email } = user;

  let requestId: string | undefined;

  try {
    const formData = await request.formData();

    const metadataRaw = formData.get("metadata");
    if (typeof metadataRaw !== "string") {
      return NextResponse.json(
        { message: "Your requisition is missing its form data" },
        { status: 400 },
      );
    }

    const { department, hodApprover, positions } = JSON.parse(metadataRaw) as {
      department: string;
      hodApprover: string;
      positions: PositionInput[];
    };

    if (isEmpty(department) || isEmpty(hodApprover)) {
      return NextResponse.json(
        { message: "Your requisition is missing some required form fields" },
        { status: 400 },
      );
    }

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one position is required to submit this requisition",
        },
        { status: 400 },
      );
    }

    const today = todayIsoDate();

    // Validate every position and collect its files - never trust client state
    const positionFiles: Partial<Record<EmployeeAttachmentType, File>>[] = [];

    for (let index = 0; index < positions.length; index++) {
      const positionError = getPositionError(positions[index], index, today);

      if (positionError) {
        return NextResponse.json({ message: positionError }, { status: 400 });
      }

      const filesResult = readPositionFiles(formData, index, true);

      if (!filesResult.ok) {
        return NextResponse.json(
          { message: filesResult.message },
          { status: 400 },
        );
      }

      positionFiles.push(filesResult.files);
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

    const { uuid: hodUuid, name: hodName, email: hodEmail } = resolvedHod;

    // Generate ids up front so we know the final file paths before touching Postgres
    requestId = randomUUID();
    const positionIds = positions.map(() => randomUUID());

    // --- Write attachments to disk first: the only failure mode this way is a
    // harmless disk-space leak, never a DB row pointing at a missing file ---
    const attachmentsByPosition: StoredAttachment[][] = [];

    try {
      for (let index = 0; index < positions.length; index++) {
        const stored = await writePositionAttachments(
          requestId,
          positionIds[index],
          positionFiles[index],
        );
        attachmentsByPosition.push(stored);
      }
    } catch (error) {
      console.error(
        "Error while writing employee requisition attachments to disk",
        error,
      );
      await deleteRequisitionDirectory(requestId);
      return NextResponse.json(
        { message: "An error occurred while trying to save your attachments" },
        { status: 500 },
      );
    }

    // --- Persist header + positions + attachments (and any self-HOD
    // auto-approvals) in a single transaction ---
    const client = await pool.connect();
    let firstPendingStage: EmployeeFirstPendingStage;

    try {
      await client.query("BEGIN");

      const retailDirectorApprovalStatus =
        department === RETAIL_DEPARTMENT ? "pending" : "N/A";

      await client.query(
        `
        INSERT INTO employee_requisitions
        (request_id, submitter_email, submitter_name, employee_department,
        employee_hod_approval_status, employee_retail_director_approval_status,
        employee_director_approval_status, employee_hr_approval_status,
        employee_hod_approver, employee_hod_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          requestId,
          email,
          name,
          department,
          "pending",
          retailDirectorApprovalStatus,
          "pending",
          "pending",
          hodName,
          hodEmail,
        ],
      );

      const positionColumns = 10;
      const positionValuesClause = positions
        .map(
          (_, index) =>
            `($${index * positionColumns + 1}, $${index * positionColumns + 2}, $${index * positionColumns + 3}, $${index * positionColumns + 4}, $${index * positionColumns + 5}, $${index * positionColumns + 6}, $${index * positionColumns + 7}, $${index * positionColumns + 8}, $${index * positionColumns + 9}, $${index * positionColumns + 10})`,
        )
        .join(", ");

      const positionParams = positions.flatMap((position, index) => [
        positionIds[index],
        requestId,
        position.title,
        Number(position.numberRequired),
        position.justification,
        position.reportingTo,
        position.dateFilled,
        position.replacementOrNew,
        position.jobGrade,
        formatSalaryRange(Number(position.salaryMin), Number(position.salaryMax)),
      ]);

      await client.query(
        `
        INSERT INTO employee_requisition_positions
        (position_id, request_id, position_title, number_required,
        position_justification, position_reporting_to, date_position_filled,
        position_replacement_or_new, position_job_grade, position_salary_range)
        VALUES ${positionValuesClause}
        `,
        positionParams,
      );

      const flatAttachments = attachmentsByPosition.flatMap(
        (attachments, positionIndex) =>
          attachments.map((attachment) => ({
            ...attachment,
            positionId: positionIds[positionIndex],
          })),
      );

      if (flatAttachments.length > 0) {
        const attachmentColumns = 9;
        const attachmentValuesClause = flatAttachments
          .map(
            (_, index) =>
              `($${index * attachmentColumns + 1}, $${index * attachmentColumns + 2}, $${index * attachmentColumns + 3}, $${index * attachmentColumns + 4}, $${index * attachmentColumns + 5}, $${index * attachmentColumns + 6}, $${index * attachmentColumns + 7}, $${index * attachmentColumns + 8}, $${index * attachmentColumns + 9})`,
          )
          .join(", ");

        const attachmentParams = flatAttachments.flatMap((attachment) => [
          attachment.attachmentId,
          attachment.positionId,
          requestId,
          attachment.originalFilename,
          attachment.storedFilename,
          attachment.filePath,
          attachment.mimeType,
          attachment.fileSizeBytes,
          attachment.attachmentType,
        ]);

        await client.query(
          `
          INSERT INTO employee_requisition_attachments
          (attachment_id, position_id, request_id, original_filename, stored_filename,
          file_path, mime_type, file_size_bytes, attachment_type)
          VALUES ${attachmentValuesClause}
          `,
          attachmentParams,
        );
      }

      firstPendingStage = await applySubmissionAutoApprovals(client, {
        requestId,
        department,
        submitterEmail: email,
        submitterName: name,
        hodEmail,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      await deleteRequisitionDirectory(requestId);
      console.error(
        "Error while trying to submit the employee requisition",
        error,
      );
      return NextResponse.json(
        { message: "An error occurred while trying to submit this requisition" },
        { status: 500 },
      );
    } finally {
      client.release();
    }

    submissionStage({
      requestId,
      submitterEmail: email,
      hodEmail,
      hodUuid,
      firstPendingStage,
    });

    return NextResponse.json(
      {
        message:
          "Your employee requisition has been submitted successfully, you will receive a confirmation email shortly",
      },
      { status: 200 },
    );
  } catch (error) {
    if (requestId) {
      await deleteRequisitionDirectory(requestId);
    }
    console.error(
      "Error while trying to submit the employee requisition",
      error,
    );
    return NextResponse.json(
      { message: "An error occurred while trying to submit this requisition" },
      { status: 500 },
    );
  }
}
