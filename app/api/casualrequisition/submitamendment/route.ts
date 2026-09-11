import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { getSession } from "@/lib/session";
import {
  validateCasualFormData,
  resolveHod,
  CasualFormDataInput,
} from "@/lib/casualRequisitionRules";
import { amendmentStage } from "@/utils/CasualApprovalStages/amendmentStage";

interface ExistingSectionRow {
  section_id: string;
  section_name: string;
  casual_justification: string;
  number_of_casuals: number;
  ppes_required: string;
  period_from: string;
  period_to: string;
  engagement_days: number;
  casual_rate_per_day: number;
  casual_total_amount: number;
}

interface SectionDiffRow {
  section_id: string | null;
  section_name: string;
  change_type: "added" | "removed" | "modified";
  previous_number_of_casuals: number | null;
  new_number_of_casuals: number | null;
  previous_justification: string | null;
  new_justification: string | null;
  previous_ppes_required: string | null;
  new_ppes_required: string | null;
  previous_period_from: string | null;
  new_period_from: string | null;
  previous_period_to: string | null;
  new_period_to: string | null;
  previous_engagement_days: number | null;
  new_engagement_days: number | null;
  previous_rate_per_day: number | null;
  new_rate_per_day: number | null;
  previous_total_amount: number | null;
  new_total_amount: number | null;
}

export async function POST(request: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  let client: PoolClient | undefined;

  try {
    const { requestId, expectedAmendmentCount, reason, formData } =
      await request.json();

    if (
      !requestId ||
      typeof expectedAmendmentCount !== "number" ||
      !reason?.trim()
    ) {
      return NextResponse.json(
        { message: "Your amendment request is missing some required fields" },
        { status: 400 },
      );
    }

    const validation = validateCasualFormData(formData as CasualFormDataInput);

    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const { ratePerDay, computedSections } = validation;
    const { department, hodApprover, location, casualCategory } =
      formData as CasualFormDataInput;

    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: headerRows } = await client.query(
      `SELECT submitter_email, employee_department, casual_location, casual_category,
       casual_hod_approver, casual_hod_email, casual_hr_approval_status, amendment_count,
       casual_hod_approval_status, casual_hod_comments, casual_hod_approval_date,
       casual_hr_approver, casual_hr_comments, casual_hr_approval_date
       FROM casual_requisitions WHERE request_id = $1 FOR UPDATE`,
      [requestId],
    );

    if (headerRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "The selected requisition could not be found" },
        { status: 404 },
      );
    }

    const header = headerRows[0];

    if (header.submitter_email !== user.email) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "You are not authorized to amend this requisition" },
        { status: 403 },
      );
    }

    if (header.casual_hr_approval_status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          message:
            "This requisition can no longer be amended - HR has already given a final decision",
        },
        { status: 409 },
      );
    }

    if (header.amendment_count !== expectedAmendmentCount) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          message:
            "This requisition was amended since you opened this form - please reopen it and try again",
        },
        { status: 409 },
      );
    }

    const resolvedHod = await resolveHod(hodApprover);

    if (!resolvedHod) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          message:
            "Could not find the selected HOD approver in current approval workflow, contact the admin for support",
        },
        { status: 404 },
      );
    }

    const { uuid: hodUuid, email: newHodEmail } = resolvedHod;

    const { rows: existingSections } = await client.query<ExistingSectionRow>(
      `SELECT section_id, section_name, casual_justification, number_of_casuals,
       ppes_required, TO_CHAR(engagement_period_from, 'YYYY-MM-DD') AS period_from,
       TO_CHAR(engagement_period_to, 'YYYY-MM-DD') AS period_to,
       engagement_days, casual_rate_per_day, casual_total_amount
       FROM casual_requisition_sections WHERE request_id = $1 FOR UPDATE`,
      [requestId],
    );

    // ---- Header diff ----
    const casualCategoryChanged =
      (casualCategory ?? null) !== (header.casual_category ?? null);
    const headerDiff = {
      previousDepartment:
        department !== header.employee_department
          ? header.employee_department
          : null,
      newDepartment:
        department !== header.employee_department ? department : null,
      previousLocation:
        location !== header.casual_location ? header.casual_location : null,
      newLocation: location !== header.casual_location ? location : null,
      previousCasualCategory: casualCategoryChanged
        ? header.casual_category
        : null,
      newCasualCategory: casualCategoryChanged ? casualCategory ?? null : null,
      previousHodApprover:
        hodApprover !== header.casual_hod_approver
          ? header.casual_hod_approver
          : null,
      newHodApprover:
        hodApprover !== header.casual_hod_approver ? hodApprover : null,
    };
    const headerChanged = Object.values(headerDiff).some((v) => v !== null);

    // ---- Section diff (matched by section_name, the stable identity) ----
    const existingByName = new Map(
      existingSections.map((s) => [s.section_name, s]),
    );
    const newByName = new Map(
      computedSections.map((s) => [s.sectionName, s]),
    );

    const sectionDiffs: SectionDiffRow[] = [];

    for (const existing of existingSections) {
      const next = newByName.get(existing.section_name);

      if (!next) {
        sectionDiffs.push({
          section_id: existing.section_id,
          section_name: existing.section_name,
          change_type: "removed",
          previous_number_of_casuals: existing.number_of_casuals,
          new_number_of_casuals: null,
          previous_justification: existing.casual_justification,
          new_justification: null,
          previous_ppes_required: existing.ppes_required,
          new_ppes_required: null,
          previous_period_from: existing.period_from,
          new_period_from: null,
          previous_period_to: existing.period_to,
          new_period_to: null,
          previous_engagement_days: existing.engagement_days,
          new_engagement_days: null,
          previous_rate_per_day: existing.casual_rate_per_day,
          new_rate_per_day: null,
          previous_total_amount: existing.casual_total_amount,
          new_total_amount: null,
        });
        continue;
      }

      const changed =
        Number(next.numberOfCasuals) !== existing.number_of_casuals ||
        next.justification !== existing.casual_justification ||
        next.ppesRequired !== existing.ppes_required ||
        next.periodFrom !== existing.period_from ||
        next.periodTo !== existing.period_to ||
        next.engagementDays !== existing.engagement_days ||
        ratePerDay !== existing.casual_rate_per_day ||
        next.totalAmount !== existing.casual_total_amount;

      if (changed) {
        sectionDiffs.push({
          section_id: existing.section_id,
          section_name: existing.section_name,
          change_type: "modified",
          previous_number_of_casuals: existing.number_of_casuals,
          new_number_of_casuals: Number(next.numberOfCasuals),
          previous_justification: existing.casual_justification,
          new_justification: next.justification,
          previous_ppes_required: existing.ppes_required,
          new_ppes_required: next.ppesRequired,
          previous_period_from: existing.period_from,
          new_period_from: next.periodFrom,
          previous_period_to: existing.period_to,
          new_period_to: next.periodTo,
          previous_engagement_days: existing.engagement_days,
          new_engagement_days: next.engagementDays,
          previous_rate_per_day: existing.casual_rate_per_day,
          new_rate_per_day: ratePerDay,
          previous_total_amount: existing.casual_total_amount,
          new_total_amount: next.totalAmount,
        });
      }
    }

    for (const next of computedSections) {
      if (!existingByName.has(next.sectionName)) {
        sectionDiffs.push({
          section_id: null,
          section_name: next.sectionName,
          change_type: "added",
          previous_number_of_casuals: null,
          new_number_of_casuals: Number(next.numberOfCasuals),
          previous_justification: null,
          new_justification: next.justification,
          previous_ppes_required: null,
          new_ppes_required: next.ppesRequired,
          previous_period_from: null,
          new_period_from: next.periodFrom,
          previous_period_to: null,
          new_period_to: next.periodTo,
          previous_engagement_days: null,
          new_engagement_days: next.engagementDays,
          previous_rate_per_day: null,
          new_rate_per_day: ratePerDay,
          previous_total_amount: null,
          new_total_amount: next.totalAmount,
        });
      }
    }

    if (!headerChanged && sectionDiffs.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "No changes were detected - nothing to amend" },
        { status: 400 },
      );
    }

    const previousTotalCasuals = existingSections.reduce(
      (sum, s) => sum + s.number_of_casuals,
      0,
    );
    const newTotalCasuals = computedSections.reduce(
      (sum, s) => sum + Number(s.numberOfCasuals),
      0,
    );
    const previousTotalAmount = existingSections.reduce(
      (sum, s) => sum + s.casual_total_amount,
      0,
    );
    const newTotalAmount = computedSections.reduce(
      (sum, s) => sum + s.totalAmount,
      0,
    );

    const amendmentNumber = header.amendment_count + 1;

    // Record the amendment - both the header/section diffs and a snapshot of
    // the approval state this amendment is about to nullify.
    const { rows: insertedAmendment } = await client.query(
      `INSERT INTO casual_requisition_amendments
       (request_id, amendment_number, amended_by_email, amended_by_name, amendment_reason,
        previous_department, new_department, previous_location, new_location,
        previous_casual_category, new_casual_category, previous_hod_approver, new_hod_approver,
        nullified_hod_status, nullified_hod_approver, nullified_hod_comments, nullified_hod_date,
        nullified_hr_status, nullified_hr_approver, nullified_hr_comments, nullified_hr_date,
        previous_total_casuals, new_total_casuals, previous_total_amount, new_total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING amendment_id`,
      [
        requestId,
        amendmentNumber,
        user.email,
        user.name,
        reason.trim(),
        headerDiff.previousDepartment,
        headerDiff.newDepartment,
        headerDiff.previousLocation,
        headerDiff.newLocation,
        headerDiff.previousCasualCategory,
        headerDiff.newCasualCategory,
        headerDiff.previousHodApprover,
        headerDiff.newHodApprover,
        header.casual_hod_approval_status,
        header.casual_hod_approver,
        header.casual_hod_comments,
        header.casual_hod_approval_date,
        header.casual_hr_approval_status,
        header.casual_hr_approver,
        header.casual_hr_comments,
        header.casual_hr_approval_date,
        previousTotalCasuals,
        newTotalCasuals,
        previousTotalAmount,
        newTotalAmount,
      ],
    );

    const amendmentId = insertedAmendment[0].amendment_id;

    for (const diff of sectionDiffs) {
      await client.query(
        `INSERT INTO casual_requisition_amendment_sections
         (amendment_id, section_id, section_name, change_type,
          previous_number_of_casuals, new_number_of_casuals,
          previous_justification, new_justification,
          previous_ppes_required, new_ppes_required,
          previous_period_from, new_period_from,
          previous_period_to, new_period_to,
          previous_engagement_days, new_engagement_days,
          previous_rate_per_day, new_rate_per_day,
          previous_total_amount, new_total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          amendmentId,
          diff.section_id,
          diff.section_name,
          diff.change_type,
          diff.previous_number_of_casuals,
          diff.new_number_of_casuals,
          diff.previous_justification,
          diff.new_justification,
          diff.previous_ppes_required,
          diff.new_ppes_required,
          diff.previous_period_from,
          diff.new_period_from,
          diff.previous_period_to,
          diff.new_period_to,
          diff.previous_engagement_days,
          diff.new_engagement_days,
          diff.previous_rate_per_day,
          diff.new_rate_per_day,
          diff.previous_total_amount,
          diff.new_total_amount,
        ],
      );
    }

    // Apply the amended header, and reset the approval chain to defaults
    await client.query(
      `UPDATE casual_requisitions
       SET employee_department = $1, casual_location = $2, casual_category = $3,
       casual_hod_approver = $4, casual_hod_email = $5,
       casual_hod_approval_status = 'pending', casual_hod_comments = NULL, casual_hod_approval_date = NULL,
       casual_hr_approval_status = 'pending', casual_hr_approver = NULL, casual_hr_email = NULL,
       casual_hr_comments = NULL, casual_hr_approval_date = NULL,
       amendment_count = $6, last_amended_at = CURRENT_TIMESTAMP
       WHERE request_id = $7`,
      [
        department,
        location,
        casualCategory ?? null,
        hodApprover,
        newHodEmail,
        amendmentNumber,
        requestId,
      ],
    );

    // Upsert surviving/changed/added sections, delete removed ones
    for (const section of computedSections) {
      await client.query(
        `INSERT INTO casual_requisition_sections
         (request_id, section_name, casual_justification, number_of_casuals,
          ppes_required, engagement_period_from, engagement_period_to,
          engagement_days, casual_rate_per_day, casual_total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (request_id, section_name) DO UPDATE SET
           casual_justification = EXCLUDED.casual_justification,
           number_of_casuals = EXCLUDED.number_of_casuals,
           ppes_required = EXCLUDED.ppes_required,
           engagement_period_from = EXCLUDED.engagement_period_from,
           engagement_period_to = EXCLUDED.engagement_period_to,
           engagement_days = EXCLUDED.engagement_days,
           casual_rate_per_day = EXCLUDED.casual_rate_per_day,
           casual_total_amount = EXCLUDED.casual_total_amount`,
        [
          requestId,
          section.sectionName,
          section.justification,
          Number(section.numberOfCasuals),
          section.ppesRequired,
          section.periodFrom,
          section.periodTo,
          section.engagementDays,
          ratePerDay,
          section.totalAmount,
        ],
      );
    }

    const removedSectionNames = sectionDiffs
      .filter((d) => d.change_type === "removed")
      .map((d) => d.section_name);

    if (removedSectionNames.length > 0) {
      await client.query(
        `DELETE FROM casual_requisition_sections WHERE request_id = $1 AND section_name = ANY($2)`,
        [requestId, removedSectionNames],
      );
    }

    // Reproduce the self-HOD auto-approve branch from the initial submission
    const selfHodAutoApproved = newHodEmail === user.email;

    if (selfHodAutoApproved) {
      await client.query(
        `UPDATE casual_requisitions
         SET casual_hod_approval_status = 'approved',
         casual_hod_approval_date = CURRENT_TIMESTAMP,
         casual_hod_comments = 'Automatic HOD Approval'
         WHERE request_id = $1`,
        [requestId],
      );
    }

    await client.query("COMMIT");

    amendmentStage({
      uuid: requestId,
      userEmail: user.email,
      amenderName: user.name,
      hodEmail: newHodEmail,
      hodUuid,
      selfHodAutoApproved,
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
    console.error(
      "Error while trying to submit the casual requisition amendment",
      error,
    );
    return NextResponse.json(
      { message: "An error occurred while trying to submit this amendment" },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}
