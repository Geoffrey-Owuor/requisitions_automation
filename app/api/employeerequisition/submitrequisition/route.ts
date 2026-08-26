import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { loadDirectorArray, loadHrArray } from "@/lib/loadAppDataV2";
import { query, pool } from "@/lib/db";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import { getSession } from "@/lib/session";
import { isDirectorEmail } from "@/utils/isDirectorEmail";
import {
  isAllowedAttachmentType,
  writePositionAttachments,
  deleteRequisitionDirectory,
  MAX_ATTACHMENT_BYTES_PER_POSITION,
  MAX_ATTACHMENTS_PER_POSITION,
  StoredAttachment,
} from "@/lib/attachmentStorage";
import {
  REPLACEMENT_OR_NEW_OPTIONS,
  JOB_GRADES,
  formatSalaryRange,
} from "@/public/assets";

type PositionInput = {
  title: string;
  numberRequired: number;
  replacementOrNew: string;
  jobGrade: string;
  salaryMin: number;
  salaryMax: number;
  justification: string;
  reportingTo: string;
  dateFilled: string;
};

// More robust validation logic
// Returns true only if the value is genuinely missing (Allowing 0 values)
const isEmpty = (val: unknown) =>
  val === null || val === undefined || val === "";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

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
    const positionFiles: File[][] = [];

    for (let index = 0; index < positions.length; index++) {
      const position = positions[index];

      if (
        isEmpty(position.title) ||
        isEmpty(position.justification) ||
        isEmpty(position.reportingTo) ||
        isEmpty(position.dateFilled)
      ) {
        return NextResponse.json(
          {
            message: `Position ${index + 1} is missing some required fields`,
          },
          { status: 400 },
        );
      }

      if (position.title.length > 100 || position.reportingTo.length > 100) {
        return NextResponse.json(
          {
            message: `Position ${index + 1}'s title/reporting to must not exceed 100 characters`,
          },
          { status: 400 },
        );
      }

      if (
        !Number.isInteger(Number(position.numberRequired)) ||
        Number(position.numberRequired) < 1
      ) {
        return NextResponse.json(
          {
            message: `Position ${index + 1} must request at least 1 number required`,
          },
          { status: 400 },
        );
      }

      if (position.dateFilled < today) {
        return NextResponse.json(
          {
            message: `Position ${index + 1}'s target fill date cannot be in the past`,
          },
          { status: 400 },
        );
      }

      if (
        !REPLACEMENT_OR_NEW_OPTIONS.includes(
          position.replacementOrNew as (typeof REPLACEMENT_OR_NEW_OPTIONS)[number],
        )
      ) {
        return NextResponse.json(
          {
            message: `Position ${index + 1} has an invalid Replacement/New selection`,
          },
          { status: 400 },
        );
      }

      if (!JOB_GRADES.includes(position.jobGrade as (typeof JOB_GRADES)[number])) {
        return NextResponse.json(
          { message: `Position ${index + 1} has an invalid Job Grade selection` },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(Number(position.salaryMin)) ||
        Number(position.salaryMin) <= 0
      ) {
        return NextResponse.json(
          {
            message: `Position ${index + 1}'s minimum salary must be greater than 0`,
          },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(Number(position.salaryMax)) ||
        Number(position.salaryMax) < Number(position.salaryMin)
      ) {
        return NextResponse.json(
          {
            message: `Position ${index + 1}'s maximum salary cannot be less than the minimum salary`,
          },
          { status: 400 },
        );
      }

      const files = formData.getAll(`positionFiles_${index}`) as File[];

      if (files.length === 0) {
        return NextResponse.json(
          {
            message: `Position ${index + 1} requires at least one attachment`,
          },
          { status: 400 },
        );
      }

      if (files.length > MAX_ATTACHMENTS_PER_POSITION) {
        return NextResponse.json(
          {
            message: `Position ${index + 1} exceeds the maximum of ${MAX_ATTACHMENTS_PER_POSITION} attachments`,
          },
          { status: 400 },
        );
      }

      let totalSize = 0;
      for (const file of files) {
        if (!isAllowedAttachmentType(file.name, file.type)) {
          return NextResponse.json(
            {
              message: `Position ${index + 1} has an attachment of an unsupported file type: ${file.name}`,
            },
            { status: 400 },
          );
        }
        totalSize += file.size;
      }

      if (totalSize > MAX_ATTACHMENT_BYTES_PER_POSITION) {
        return NextResponse.json(
          {
            message: `Position ${index + 1}'s attachments exceed the 5MB total size limit`,
          },
          { status: 400 },
        );
      }

      positionFiles.push(files);
    }

    const hodApproverResult = await query(
      `
      SELECT hod_uuid AS uuid,
      hod_email AS email
      FROM hod_array WHERE hod_name = $1 LIMIT 1
      `,
      [hodApprover],
    );

    if (hodApproverResult.length === 0) {
      return NextResponse.json(
        {
          message:
            "Could not find the selected HOD approver in current approval workflow, contact the admin for support",
        },
        { status: 404 },
      );
    }

    const hodUuid = hodApproverResult[0].uuid;
    const hodEmail = hodApproverResult[0].email;

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

    // --- Persist header + positions + attachments in a single transaction ---
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO employee_requisitions
        (request_id, submitter_email, submitter_name, employee_department,
        employee_hod_approval_status, employee_director_approval_status, employee_hr_approval_status,
        employee_hod_approver, employee_hod_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          requestId,
          email,
          name,
          department,
          "pending",
          "pending",
          "pending",
          hodApprover,
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
        const attachmentColumns = 8;
        const attachmentValuesClause = flatAttachments
          .map(
            (_, index) =>
              `($${index * attachmentColumns + 1}, $${index * attachmentColumns + 2}, $${index * attachmentColumns + 3}, $${index * attachmentColumns + 4}, $${index * attachmentColumns + 5}, $${index * attachmentColumns + 6}, $${index * attachmentColumns + 7}, $${index * attachmentColumns + 8})`,
          )
          .join(", ");

        const attachmentParams = flatAttachments.flatMap((attachment) => [
          attachment.positionId,
          requestId,
          attachment.originalFilename,
          attachment.storedFilename,
          attachment.filePath,
          attachment.mimeType,
          attachment.fileSizeBytes,
          attachment.uploadIndex,
        ]);

        await client.query(
          `
          INSERT INTO employee_requisition_attachments
          (position_id, request_id, original_filename, stored_filename,
          file_path, mime_type, file_size_bytes, upload_index)
          VALUES ${attachmentValuesClause}
          `,
          attachmentParams,
        );
      }

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

    // Running an update if the requestor is the HOD
    if (hodEmail === email) {
      await query(
        `
        UPDATE employee_requisitions
        SET
        employee_hod_approval_date = CURRENT_TIMESTAMP,
        employee_hod_email = $1,
        employee_hod_approval_status = $2,
        employee_hod_comments = $3
        WHERE request_id = $4
        `,
        [hodEmail, "approved", "Automatic HOD Approval", requestId],
      );

      // If this self-approving HOD is also a Director/CEO, auto-approve the
      // CEO stage too and forward straight to HR, rather than asking the
      // same person to approve their own requisition twice.
      const hodIsDirector = await isDirectorEmail(pool, hodEmail);

      if (hodIsDirector) {
        await query(
          `
          UPDATE employee_requisitions
          SET employee_director_approval_date = CURRENT_TIMESTAMP,
          employee_director_approval_status = $1,
          employee_director_approver = $2,
          employee_director_email = $3,
          employee_director_comments = $4
          WHERE request_id = $5
          `,
          [
            "approved",
            name,
            hodEmail,
            "Automatically approved - the HOD is also a Director/CEO, so a separate CEO approval is not required",
            requestId,
          ],
        );

        const HR_ARRAY = await loadHrArray();

        HR_ARRAY.forEach((hrApprover) => {
          EmployeeEmailSender({
            to: hrApprover.email,
            requestId: requestId!,
            message:
              "A new employee requisition has been submitted and requires your approval",
            title: "Action Required: New Employee Requisition",
            role: "HR",
            reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
          });
        });

        EmployeeEmailSender({
          to: email,
          requestId,
          message:
            "Your employee requisition has been successfully submitted. As you are also a Director/CEO, the CEO approval stage was automatically approved and this has been forwarded to HR for approval",
          title: "Update: Employee requisition submitted successfully",
          role: "user",
        });
      } else {
        const DIRECTOR_ARRAY = await loadDirectorArray();

        DIRECTOR_ARRAY.forEach((directorApprover) => {
          EmployeeEmailSender({
            to: directorApprover.email,
            requestId: requestId!,
            message:
              "A new employee requisition has been submitted and requires your approval",
            title: "Action Required: New Employee Requisition",
            role: "CEO",
            reviewLink: `?token=${directorApprover.uuid}&stage=director`,
          });
        });

        EmployeeEmailSender({
          to: email,
          requestId,
          message:
            "Your employee requisition has been successfully submitted and forwarded to the CEO for approval",
          title: "Update: Employee requisition submitted successfully",
          role: "user",
        });
      }
    } else {
      EmployeeEmailSender({
        to: hodEmail,
        requestId,
        message:
          "A new employee requisition has been submitted and requires your approval",
        title: "Action Required: Employee Requisition Review",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });

      EmployeeEmailSender({
        to: email,
        requestId,
        message:
          "Your employee requisition has been submitted successfully and forwarded to the HOD for approval.",
        title: "Update: Employee Requisition Successfully Submitted",
        role: "user",
      });
    }

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
