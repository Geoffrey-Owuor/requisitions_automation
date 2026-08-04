import { NextResponse, NextRequest } from "next/server";
import { loadFinanceArray } from "@/lib/loadAppDataV2";
import { query } from "@/lib/db";
import { CasualEmailSender } from "@/services/CasualEmailSender";
import { getSession } from "@/lib/session";
import { getCasualRatePerDay } from "@/public/assets";

// Inclusive day-count between two ISO (YYYY-MM-DD) date strings
function engagementDaysBetween(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T00:00:00");
  const diffDays =
    Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return diffDays;
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

  const FINANCE_ARRAY = await loadFinanceArray();

  try {
    const { formData, totalAmount, submittedBy } = await request.json();

    // Destructure the submitted by area to get a valid name and email
    const { name, email } = submittedBy;

    // Unauthorized user
    if (!name || !email) {
      return NextResponse.json(
        { message: "Cannot verify the user trying to make this requisition" },
        { status: 400 },
      );
    }

    // Destructure form data
    const {
      department,
      hodApprover,
      location,
      justification,
      numberOfCasuals,
      ppesRequired,
      periodFrom,
      periodTo,
    } = formData;

    // More robust validation logic
    // Returns true only if the value is genuinely missing (Allowing 0 values)
    const isEmpty = (val: unknown) =>
      val === null || val === undefined || val === "";

    const missingFields = Object.values(formData).some((value) =>
      isEmpty(value),
    );

    if (missingFields) {
      return NextResponse.json(
        { message: "Your requisition is missing some required form fields" },
        { status: 400 },
      );
    }

    // Hard stops per requisition rules
    if (Number(numberOfCasuals) <= 0) {
      return NextResponse.json(
        { message: "The number of casuals requested must be at least 1" },
        { status: 400 },
      );
    }

    if (periodTo < periodFrom) {
      return NextResponse.json(
        {
          message:
            "The casual engagement period's end date cannot be earlier than the start date",
        },
        { status: 400 },
      );
    }

    // Recompute the derived values server-side rather than trusting the client
    const engagementDays = engagementDaysBetween(periodFrom, periodTo);
    const ratePerDay = getCasualRatePerDay(location);
    const computedTotalAmount =
      Number(numberOfCasuals) * ratePerDay * engagementDays;

    if (computedTotalAmount !== Number(totalAmount)) {
      return NextResponse.json(
        {
          message:
            "The submitted total amount does not match the computed amount for this requisition",
        },
        { status: 400 },
      );
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

    // get the hod uuid and email - or fall back to an invalid string
    const hodUuid = hodApproverResult[0].uuid;
    const hodEmail = hodApproverResult[0].email;

    // Create the insert query - all three stages are always active (no tiering)
    const insertQuery = `
    INSERT INTO casual_requisitions
    (submitter_email, submitter_name, employee_department, casual_location,
    casual_justification, number_of_casuals, ppes_required, engagement_period_from,
    engagement_period_to, engagement_days, casual_rate_per_day, casual_total_amount,
    casual_hod_approval_status, casual_finance_approval_status, casual_hr_approval_status,
    casual_hod_approver, casual_hod_email)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING request_id
    `;

    const insertParams = [
      email,
      name,
      department,
      location,
      justification,
      numberOfCasuals,
      ppesRequired,
      periodFrom,
      periodTo,
      engagementDays,
      ratePerDay,
      computedTotalAmount,
      "pending",
      "pending",
      "pending",
      hodApprover,
      hodEmail,
    ];

    // Run the query
    const result = await query(insertQuery, insertParams);

    // Get the returned uuid
    const requestUuid = result[0].request_id;

    // Running an update if the requestor is the HOD
    if (hodEmail === email) {
      const updateQuery = `
        UPDATE casual_requisitions
        SET
        casual_hod_approval_date = CURRENT_TIMESTAMP,
        casual_hod_email = $1,
        casual_hod_approval_status = $2,
        casual_hod_comments = $3
        WHERE request_id = $4
        `;

      const updateParams = [
        hodEmail,
        "approved",
        "Automatic HOD Approval",
        requestUuid,
      ];
      await query(updateQuery, updateParams);

      // Send mail to Finance Approvers
      FINANCE_ARRAY.forEach((financeApprover) => {
        CasualEmailSender({
          to: financeApprover.email,
          requestId: requestUuid,
          message:
            "A new casual requisition has been submitted and requires your approval",
          title: "Action Required: New Casual Requisition",
          role: "Finance",
          reviewLink: `?token=${financeApprover.uuid}&stage=finance`,
        });
      });

      // Send confirmation email to HOD/submitter
      CasualEmailSender({
        to: email,
        requestId: requestUuid,
        message:
          "Your casual requisition has been successfully submitted and forwarded to Finance for approval",
        title: "Update: Casual requisition submitted successfully",
        role: "user",
      });
    } else {
      // Normal workflow - Normal user (Send email to user and HOD)
      // HOD Send
      CasualEmailSender({
        to: hodEmail,
        requestId: requestUuid,
        message:
          "A new casual requisition has been submitted and requires your approval",
        title: "Action Required: Casual Requisition Review",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });
      // User Send
      CasualEmailSender({
        to: email,
        requestId: requestUuid,
        message:
          "Your casual requisition has been submitted successfully and forwarded to the HOD for approval.",
        title: "Update: Casual Requisition Successfully Submitted",
        role: "user",
      });
    }

    // Return a success response
    return NextResponse.json(
      {
        message:
          "Your casual requisition has been submitted successfully, you will receive a confirmation email shortly",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error while trying to submit the casual requisition",
      error,
    );
    return NextResponse.json(
      { message: "An error occurred while trying to submit this requisition" },
      { status: 500 },
    );
  }
}
