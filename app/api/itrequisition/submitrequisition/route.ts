import { NextResponse, NextRequest } from "next/server";
import { HOD_ARRAY, IT_ARRAY } from "@/secretAssets";
import { ITEmailSender } from "@/services/ITEmailSender";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
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

    // Form Data destructuring
    const {
      employeeName,
      department,
      staffNumber,
      requestType,
      hodApprover,
      requirements, //This is an array of strings
      otherRequirements,
      requisitionDate,
      dateJoining,
    } = formData;

    // 1. Define which fields are strictly required
    const requiredFields = [
      employeeName,
      department,
      staffNumber,
      requestType,
      hodApprover,
      otherRequirements,
      requisitionDate,
      dateJoining,
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

    // Get the hod object from the array
    const hodObject = HOD_ARRAY.find((hod) => hod.name === hodApprover);

    // get the hod uuid and email - or fall back to an invalid string
    const hodUuid = hodObject?.uuid;
    const hodEmail = hodObject?.email;

    if (!hodUuid || !hodEmail) {
      return NextResponse.json(
        {
          message:
            "Could not find the selected HOD approver in current approval workflow, contact the admin for support",
        },
        { status: 404 },
      );
    }

    //Join the requirements array into one text separated by comas
    const joinedRequirements = requirements.join(", ");

    // Our first insert query
    const insertQuery = `
  INSERT INTO it_requisitions
  (submitter_email, submitter_name, employee_name, employee_department, employee_staff_number,
   replacement_new, requirements, other_requirements, requisition_date, date_joining, hod_approver_name)
   VALUES
   ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
   RETURNING request_id
  `;

    //Our query params
    const insertParams = [
      email,
      name,
      employeeName,
      department,
      staffNumber,
      requestType,
      joinedRequirements,
      otherRequirements,
      requisitionDate,
      dateJoining,
      hodApprover,
    ];

    // Run the query
    const result = await query(insertQuery, insertParams);

    // Get the returned uuid
    const requestId = result[0].request_id;

    // Logic for when the requestor is an HOD
    if (hodEmail === email) {
      const updateQuery = `
        UPDATE it_requisitions
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

      // Send mail to IT approvers
      IT_ARRAY.forEach((itApprover) => {
        ITEmailSender({
          to: itApprover.email,
          requestId: requestId,
          message:
            "A new IT Requisition has been submitted and requires your review",
          title: "Action Required: New IT Requisition",
          role: "IT",
          reviewLink: `?token=${itApprover.uuid}&stage=it`,
        });
      });

      // Send Email to the HOD approver
      ITEmailSender({
        to: email,
        requestId: requestId,
        message:
          "Your IT requisition has been submitted successfully and forwaded to IT for review",
        title: "Update: IT Requisition Submitted Successfully",
        role: "user",
      });
    } else {
      // Follow the normal workflow - send to HOD and User
      ITEmailSender({
        to: hodEmail,
        requestId: requestId,
        message:
          "A new IT Requisition has been submitted and requires your review",
        title: "Action Required: New IT Requisition",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });

      // Send Email to the HOD approver
      ITEmailSender({
        to: email,
        requestId: requestId,
        message:
          "Your IT requisition has been submitted successfully and forwaded to the HOD for review",
        title: "Update: IT Requisition Submitted Successfully",
        role: "user",
      });
    }

    // Return a success response
    return NextResponse.json(
      {
        message:
          "Your IT requisition has been submitted successfully, you will receive a confirmation email shortly",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error while trying to submit the requisition", error);
    return NextResponse.json(
      { message: "An error occurred while trying to submit this requisition" },
      { status: 500 },
    );
  }
}
