import { NextResponse, NextRequest } from "next/server";
import { loadHrArray } from "@/lib/loadAppDataV2";
import { query } from "@/lib/db";
import { CasualEmailSender } from "@/services/CasualEmailSender";
import { getSession } from "@/lib/session";
import {
  validateCasualFormData,
  resolveHod,
  CasualFormDataInput,
} from "@/lib/casualRequisitionRules";

export async function POST(request: NextRequest) {
  // Check if we have a valid session
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  const HR_ARRAY = await loadHrArray("casual");

  try {
    const { formData, submittedBy } = await request.json();

    // Destructure the submitted by area to get a valid name and email
    const { name, email } = submittedBy;

    // Unauthorized user
    if (!name || !email) {
      return NextResponse.json(
        { message: "Cannot verify the user trying to make this requisition" },
        { status: 400 },
      );
    }

    const validation = validateCasualFormData(formData as CasualFormDataInput);

    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const { ratePerDay, computedSections } = validation;
    const { department, hodApprover, location, casualCategory } = formData;

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

    const { uuid: hodUuid, email: hodEmail } = resolvedHod;

    // Create the header insert query - both stages are always active (no tiering)
    const insertQuery = `
    INSERT INTO casual_requisitions
    (submitter_email, submitter_name, employee_department, casual_location,
    casual_category, casual_hod_approval_status, casual_hr_approval_status,
    casual_hod_approver, casual_hod_email)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING request_id
    `;

    const insertParams = [
      email,
      name,
      department,
      location,
      casualCategory ?? null,
      "pending",
      "pending",
      hodApprover,
      hodEmail,
    ];

    // Run the query
    const result = await query(insertQuery, insertParams);

    // Get the returned uuid
    const requestUuid = result[0].request_id;

    // Bulk-insert one row per section, linked to the header via request_id
    const sectionColumns = 10;
    const sectionValuesClause = computedSections
      .map(
        (_, index) =>
          `($${index * sectionColumns + 1}, $${index * sectionColumns + 2}, $${index * sectionColumns + 3}, $${index * sectionColumns + 4}, $${index * sectionColumns + 5}, $${index * sectionColumns + 6}, $${index * sectionColumns + 7}, $${index * sectionColumns + 8}, $${index * sectionColumns + 9}, $${index * sectionColumns + 10})`,
      )
      .join(", ");

    const sectionParams = computedSections.flatMap((section) => [
      requestUuid,
      section.sectionName,
      section.justification,
      Number(section.numberOfCasuals),
      section.ppesRequired,
      section.periodFrom,
      section.periodTo,
      section.engagementDays,
      ratePerDay,
      section.totalAmount,
    ]);

    await query(
      `
      INSERT INTO casual_requisition_sections
      (request_id, section_name, casual_justification, number_of_casuals,
      ppes_required, engagement_period_from, engagement_period_to,
      engagement_days, casual_rate_per_day, casual_total_amount)
      VALUES ${sectionValuesClause}
      `,
      sectionParams,
    );

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

      // Send mail to HR Approvers
      HR_ARRAY.forEach((hrApprover) => {
        CasualEmailSender({
          to: hrApprover.email,
          requestId: requestUuid,
          message:
            "A new casual requisition has been submitted and requires your approval",
          title: "Action Required: New Casual Requisition",
          role: "HR",
          reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
        });
      });

      // Send confirmation email to HOD/submitter
      CasualEmailSender({
        to: email,
        requestId: requestUuid,
        message:
          "Your casual requisition has been successfully submitted and forwarded to HR for approval",
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
