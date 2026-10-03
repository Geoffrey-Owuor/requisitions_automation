import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { getSession } from "@/lib/session";
import { assignedHodNameSql, resolveHod, sameEmail } from "@/lib/hodAssignment";
import {
  TravelFormDataInput,
  validateTravelFormData,
} from "@/lib/travelRequisitionRules";
import {
  getTravelAmendmentBlocker,
  MAX_AMENDMENT_REASON_LENGTH,
  TRAVEL_AMENDMENT_FIELDS,
} from "@/lib/travelAmendment";
import { PUSHBACK_WINDOW_SQL } from "@/lib/travelPushback";
import { amendmentStage } from "@/utils/TravelApprovalStages/amendmentStage";

// Stored value -> the text form it is compared and recorded in. Dates are
// read as YYYY-MM-DD strings (see the SELECT below), so every field reduces
// to a plain string; empty strings and NULL both mean "no value".
const asText = (value: unknown): string | null =>
  value === null || value === undefined || value === ""
    ? null
    : String(value).trim();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

    const trimmedReason = typeof reason === "string" ? reason.trim() : "";

    if (
      !requestId ||
      typeof expectedAmendmentCount !== "number" ||
      !trimmedReason
    ) {
      return NextResponse.json(
        { message: "Your amendment request is missing some required fields" },
        { status: 400 },
      );
    }

    if (trimmedReason.length > MAX_AMENDMENT_REASON_LENGTH) {
      return NextResponse.json(
        {
          message: `The amendment reason cannot exceed ${MAX_AMENDMENT_REASON_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const validation = validateTravelFormData(formData as TravelFormDataInput);

    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const { totalCost, approvalTier } = validation;
    const input = formData as TravelFormDataInput;
    const engineeringJobs =
      input.department === "Engineering & HVAC"
        ? input.engineeringJobs || null
        : null;

    if (
      !ISO_DATE.test(input.departureDate) ||
      !ISO_DATE.test(input.returnDate)
    ) {
      return NextResponse.json(
        { message: "The travel dates provided are not valid" },
        { status: 400 },
      );
    }

    if (input.returnDate < input.departureDate) {
      return NextResponse.json(
        { message: "The return date cannot be before the departure date" },
        { status: 400 },
      );
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: headerRows } = await client.query(
      `SELECT submitter_email, amendment_count, travel_approval_tier, travel_total_cost,
       employee_name, employee_department, employee_designation, travel_cost_center,
       travel_hod_approver, travel_hod_email, travel_destination,
       ${assignedHodNameSql("travel_hod_email", "travel_hod_approver")} AS assigned_hod_name,
       TO_CHAR(travel_departure_date, 'YYYY-MM-DD') AS travel_departure_date,
       TO_CHAR(travel_return_date, 'YYYY-MM-DD') AS travel_return_date,
       travel_category, travel_mode, travel_within_budget, travel_business_justification,
       travel_transport_cost, travel_other_costs, travel_per_diem, engineering_jobs,
       travel_hod_approval_status, travel_hod_comments, travel_hod_approval_date,
       travel_hr_approval_status, travel_hr_approver, travel_hr_comments, travel_hr_approval_date,
       travel_director_approval_status, travel_director_approver,
       travel_director_comments, travel_director_approval_date,
       ${PUSHBACK_WINDOW_SQL} AS within_window,
       ($2::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date) AS new_departure_not_past
       FROM travel_requisitions WHERE request_id = $1 FOR UPDATE`,
      [requestId, input.departureDate],
    );

    if (headerRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "The selected requisition could not be found" },
        { status: 404 },
      );
    }

    const header = headerRows[0];

    if (!sameEmail(header.submitter_email, user.email)) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "You are not authorized to amend this requisition" },
        { status: 403 },
      );
    }

    const blocker = getTravelAmendmentBlocker({
      hrStatus: header.travel_hr_approval_status,
      withinWindow: header.within_window,
    });

    if (blocker) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: blocker }, { status: 409 });
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

    if (!header.new_departure_not_past) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "The departure date cannot be in the past" },
        { status: 400 },
      );
    }

    const resolvedHod = await resolveHod(input.hodApprover);

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

    const { uuid: hodUuid, name: newHodName, email: newHodEmail } = resolvedHod;
    const hodChanged = !sameEmail(newHodEmail, header.travel_hod_email);

    // ---- Field diff ----
    // The form sends the HOD's email; the HOD is recorded by name
    const newValues: Record<string, unknown> = {
      ...input,
      hodApprover: newHodName,
      engineeringJobs,
    };

    // travel_hod_approver holds whoever acted on the HOD stage (possibly an
    // alternate) - diff the HOD field against the ASSIGNED HOD instead. The
    // nullified-decision snapshot below keeps the actual approver's name.
    const diffSource = {
      ...header,
      travel_hod_approver: header.assigned_hod_name,
    };

    const fieldDiffs = TRAVEL_AMENDMENT_FIELDS.map((field) => ({
      fieldKey: field.key,
      previousValue: asText(diffSource[field.column]),
      newValue: asText(newValues[field.key]),
    })).filter((diff) =>
      // Names aren't unique - the HOD counts as changed by email
      diff.fieldKey === "hodApprover"
        ? hodChanged
        : diff.previousValue !== diff.newValue,
    );

    if (fieldDiffs.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "No changes were detected - nothing to amend" },
        { status: 400 },
      );
    }

    const amendmentNumber = header.amendment_count + 1;

    // Record the amendment - the field diffs and a snapshot of the approval
    // state this amendment is about to reset.
    const { rows: insertedAmendment } = await client.query(
      `INSERT INTO travel_requisition_amendments
       (request_id, amendment_number, amended_by_email, amended_by_name, amendment_reason,
        previous_total_cost, new_total_cost, previous_approval_tier, new_approval_tier,
        nullified_hod_status, nullified_hod_approver, nullified_hod_comments, nullified_hod_date,
        nullified_hr_status, nullified_hr_approver, nullified_hr_comments, nullified_hr_date,
        nullified_director_status, nullified_director_approver, nullified_director_comments,
        nullified_director_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING amendment_id`,
      [
        requestId,
        amendmentNumber,
        user.email,
        user.name,
        trimmedReason,
        header.travel_total_cost,
        totalCost,
        header.travel_approval_tier,
        approvalTier,
        header.travel_hod_approval_status,
        header.travel_hod_approver,
        header.travel_hod_comments,
        header.travel_hod_approval_date,
        header.travel_hr_approval_status,
        header.travel_hr_approver,
        header.travel_hr_comments,
        header.travel_hr_approval_date,
        header.travel_director_approval_status,
        header.travel_director_approver,
        header.travel_director_comments,
        header.travel_director_approval_date,
      ],
    );

    const amendmentId = insertedAmendment[0].amendment_id;

    for (const diff of fieldDiffs) {
      await client.query(
        `INSERT INTO travel_requisition_amendment_fields
         (amendment_id, field_key, previous_value, new_value)
         VALUES ($1, $2, $3, $4)`,
        [amendmentId, diff.fieldKey, diff.previousValue, diff.newValue],
      );
    }

    // Apply the amended fields, recompute the tier, and reset the whole
    // approval chain. Director only applies to Tier 3. The push-back count
    // is deliberately left alone - the cap is for the requisition's life.
    await client.query(
      `UPDATE travel_requisitions
       SET employee_name = $1, employee_department = $2, employee_designation = $3,
       travel_cost_center = $4, travel_hod_approver = $5, travel_hod_email = $6,
       travel_destination = $7, travel_departure_date = $8, travel_return_date = $9,
       travel_category = $10, travel_mode = $11, travel_within_budget = $12,
       travel_business_justification = $13, travel_transport_cost = $14,
       travel_other_costs = $15, travel_per_diem = $16, travel_total_cost = $17,
       travel_approval_tier = $18, engineering_jobs = $19,
       travel_hod_approval_status = 'pending', travel_hod_comments = NULL, travel_hod_approval_date = NULL,
       travel_hod_actioned_by_email = NULL,
       travel_hr_approval_status = 'pending', travel_hr_approver = NULL, travel_hr_email = NULL,
       travel_hr_comments = NULL, travel_hr_approval_date = NULL,
       travel_director_approval_status = $20, travel_director_approver = NULL,
       travel_director_email = NULL, travel_director_comments = NULL,
       travel_director_approval_date = NULL,
       amendment_count = $21, last_amended_at = CURRENT_TIMESTAMP
       WHERE request_id = $22`,
      [
        input.employeeName,
        input.department,
        input.designation,
        input.costCentre,
        newHodName,
        newHodEmail,
        input.destination,
        input.departureDate,
        input.returnDate,
        input.travelCategory,
        input.travelMode,
        input.withinBudget,
        input.justification,
        Number(input.transportCost),
        Number(input.otherCost),
        Number(input.perDiem),
        totalCost,
        approvalTier,
        engineeringJobs,
        approvalTier === "Tier 3" ? "pending" : "N/A",
        amendmentNumber,
        requestId,
      ],
    );

    // Reproduce the self-HOD auto-approve branch from the initial submission
    const selfHodAutoApproved = sameEmail(newHodEmail, user.email);

    if (selfHodAutoApproved) {
      await client.query(
        `UPDATE travel_requisitions
         SET travel_hod_approval_status = 'approved',
         travel_hod_approval_date = CURRENT_TIMESTAMP,
         travel_hod_actioned_by_email = $2,
         travel_hod_comments = 'Automatic HOD Approval'
         WHERE request_id = $1`,
        [requestId, user.email],
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
      "Error while trying to submit the travel requisition amendment",
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
