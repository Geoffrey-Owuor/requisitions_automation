import { NextResponse, NextRequest } from "next/server";
import { loadHrArray } from "@/lib/loadAppDataV2";
import { query } from "@/lib/db";
import { CasualEmailSender } from "@/services/CasualEmailSender";
import { getSession } from "@/lib/session";
import {
  getCasualRatePerDay,
  getCasualSections,
  ENGINEERING_HVAC_DEPARTMENT,
  CASUAL_CATEGORIES,
  CasualCategory,
} from "@/public/assets";

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

type CasualSectionInput = {
  sectionName: string;
  justification: string;
  numberOfCasuals: number;
  ppesRequired: string;
  periodFrom: string;
  periodTo: string;
};

export async function POST(request: NextRequest) {
  // Check if we have a valid session
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  const HR_ARRAY = await loadHrArray();

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

    // Destructure form data
    const { department, hodApprover, location, sections, casualCategory } =
      formData;

    // More robust validation logic
    // Returns true only if the value is genuinely missing (Allowing 0 values)
    const isEmpty = (val: unknown) =>
      val === null || val === undefined || val === "";

    if (isEmpty(department) || isEmpty(hodApprover) || isEmpty(location)) {
      return NextResponse.json(
        { message: "Your requisition is missing some required form fields" },
        { status: 400 },
      );
    }

    if (
      department === ENGINEERING_HVAC_DEPARTMENT &&
      !CASUAL_CATEGORIES.includes(casualCategory)
    ) {
      return NextResponse.json(
        {
          message:
            "A valid casual category (Technician or Welder) is required for the Engineering & HVAC department",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one section is required to submit this requisition",
        },
        { status: 400 },
      );
    }

    // The set of sections valid for this department/location - guards against tampering
    const allowedSections = getCasualSections(department, location);

    for (const section of sections as CasualSectionInput[]) {
      if (!allowedSections.includes(section.sectionName)) {
        return NextResponse.json(
          {
            message: `"${section.sectionName}" is not a valid section for the selected location`,
          },
          { status: 400 },
        );
      }

      if (
        isEmpty(section.justification) ||
        isEmpty(section.ppesRequired) ||
        isEmpty(section.periodFrom) ||
        isEmpty(section.periodTo)
      ) {
        return NextResponse.json(
          {
            message: `Section "${section.sectionName}" is missing some required fields`,
          },
          { status: 400 },
        );
      }

      if (Number(section.numberOfCasuals) <= 0) {
        return NextResponse.json(
          {
            message: `Section "${section.sectionName}" must request at least 1 casual`,
          },
          { status: 400 },
        );
      }

      if (section.periodTo < section.periodFrom) {
        return NextResponse.json(
          {
            message: `Section "${section.sectionName}"'s engagement period end date cannot be earlier than its start date`,
          },
          { status: 400 },
        );
      }
    }

    const ratePerDay = getCasualRatePerDay(
      location,
      department,
      casualCategory as CasualCategory | undefined,
    );

    // Recompute the derived values server-side rather than trusting the client
    const computedSections = (sections as CasualSectionInput[]).map(
      (section) => {
        const engagementDays = engagementDaysBetween(
          section.periodFrom,
          section.periodTo,
        );
        const totalAmount =
          Number(section.numberOfCasuals) * ratePerDay * engagementDays;

        return { ...section, engagementDays, totalAmount };
      },
    );

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

    // Create the header insert query - both stages are always active (no tiering)
    const insertQuery = `
    INSERT INTO casual_requisitions
    (submitter_email, submitter_name, employee_department, casual_location,
    casual_hod_approval_status, casual_hr_approval_status,
    casual_hod_approver, casual_hod_email)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING request_id
    `;

    const insertParams = [
      email,
      name,
      department,
      location,
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
