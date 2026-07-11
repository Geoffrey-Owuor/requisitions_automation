import { NextResponse, NextRequest } from "next/server";
import { loadSecurityArray } from "@/lib/loadAppDataV2";
import { AccessEmailSender } from "@/services/AccessEmailSender";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Get security data
  const SECURITY_ARRAY = await loadSecurityArray();

  try {
    // Getting our payload
    const { formData, submittedBy } = await request.json();

    // Destructure submitted area to get a valid email and name
    const { name, email } = submittedBy;

    // Unauthorized user
    if (!name || !email) {
      return NextResponse.json(
        { message: "Cannot verify the user trying to make this requisition" },
        { status: 401 },
      );
    }

    // Form data destructuring
    const {
      employeeName,
      staffNumber,
      department,
      hodApprover,
      issuanceDate,
      requirements,
      locations,
    } = formData;

    // Required fields
    const requiredFields = [
      employeeName,
      staffNumber,
      department,
      hodApprover,
      issuanceDate,
      requirements,
      locations,
    ];

    //Check if some fields are missing
    const isMissingFields =
      requiredFields.some((field) => !field) ||
      !requirements ||
      requirements.length === 0;

    if (isMissingFields) {
      return NextResponse.json(
        { message: "Your requisition is missing some required form fields" },
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

    // First insert query
    const insertQuery = `
    INSERT INTO access_requisitions
    (submitter_email, submitter_name, employee_name, employee_department, employee_staff_number, 
    issuance_date, access_locations, access_requirements, hod_approver_name)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING request_id
    `;

    // Our query params
    const insertParams = [
      email,
      name,
      employeeName,
      department,
      staffNumber,
      issuanceDate,
      locations,
      requirements,
      hodApprover,
    ];

    // Run the query
    const result = await query(insertQuery, insertParams);

    // Get the returned uuid
    const requestId = result[0].request_id;

    if (hodEmail === email) {
      const updateQuery = `
        UPDATE access_requisitions
        SET
        hod_approval_date = CURRENT_TIMESTAMP,
        hod_approver_email = $1,
        hod_approver_status = $2,
        hod_approver_comments = $3
        WHERE request_id = $4
        `;
      const updateParams = [
        hodEmail,
        "approved",
        "Automatic HOD Approval",
        requestId,
      ];

      await query(updateQuery, updateParams);

      // Send mail to security approvers
      SECURITY_ARRAY.forEach((securityApprover) => {
        AccessEmailSender({
          to: securityApprover.email,
          requestId: requestId,
          message:
            "A new Access Requisition has been submitted and requires your review",
          title: "Action Required: New Access Requisition",
          role: "security",
          reviewLink: `?token=${securityApprover.uuid}&stage=security`,
        });
      });

      // Send Email to the HOD approver
      AccessEmailSender({
        to: email,
        requestId: requestId,
        message:
          "Your Access requisition has been submitted successfully and forwaded to Security for review",
        title: "Update: Access Requisition Submitted Successfully",
        role: "user",
      });
    } else {
      // Follow the normal workflow - send to HOD and User
      AccessEmailSender({
        to: hodEmail,
        requestId: requestId,
        message:
          "A new Access Requisition has been submitted and requires your review",
        title: "Action Required: New Access Requisition",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });

      // Send Email to the user
      AccessEmailSender({
        to: email,
        requestId: requestId,
        message:
          "Your Access requisition has been submitted successfully and forwaded to the HOD for review",
        title: "Update: Access Requisition Submitted Successfully",
        role: "user",
      });
    }

    // Return a success response
    return NextResponse.json(
      {
        message:
          "Your access requisition has been submitted successfully, you will receive a confirmation email shortly",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error while trying to submit the Access requisition", error);
    return NextResponse.json(
      { message: "An error occurred while trying to submit this requisition" },
      { status: 500 },
    );
  }
}
