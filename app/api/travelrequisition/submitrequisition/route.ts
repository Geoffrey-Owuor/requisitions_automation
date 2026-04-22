import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { HOD_ARRAY, HR_ARRAY } from "@/public/secretAssets";
import { query } from "@/lib/db";
import { EmailSender } from "@/services/EmailSender";

export async function POST(request: NextRequest) {
  try {
    const { formData, totalCost, approvalTier, submittedBy } =
      await request.json();

    // Destructure the submitted by area to get a valid name and email
    const { name, email } = submittedBy;

    // Unauthorized user
    if (!name || !email) {
      return NextResponse.json(
        { message: "Cannot verify the user trying to make this requisition" },
        { status: 401 },
      );
    }

    // Destructure form data
    const {
      employeeName,
      department,
      designation,
      hodApprover,
      destination,
      departureDate,
      returnDate,
      travelCategory,
      justification,
      travelMode,
      transportCost,
      otherCost,
      perDiem,
      costCentre,
      withinBudget,
    } = formData;

    const missingFields = Object.values(formData).some((value) => !value);

    if (missingFields) {
      return NextResponse.json(
        { message: "Your requisition is missing some required form fields" },
        { status: 400 },
      );
    }

    // Get the hod object from the HOD's array
    const hodObject = HOD_ARRAY.find((hod) => hod.name === hodApprover);

    // get the hod uuid and email - or fall back to an invalid string
    const hodUuid = hodObject ? hodObject.uuid : "invalid_uuid";
    const hodEmail = hodObject ? hodObject.email : "invalid_email";

    // Generate status for HOD Approval, HR Approval and Director Approval Statuses
    const hodStatus = "pending";
    const hrStatus =
      approvalTier === "Tier 2" || approvalTier === "Tier 3"
        ? "Pending"
        : "N/A";
    const directorStatus = approvalTier === "Tier 3" ? "Pending" : "N/A";

    // Create the insert query
    const insertQuery = `
    INSERT INTO travel_requisitions
    (submitter_email, submitter_name, employee_name, employee_department, employee_designation, 
    travel_destination, travel_departure_date, travel_return_date, travel_category,
    travel_business_justification, travel_mode, travel_transport_cost,
    travel_other_costs, travel_per_diem, travel_total_cost, travel_cost_center, travel_within_budget,
    travel_approval_tier, travel_hod_approval_status, travel_hr_approval_status,
    travel_director_approval_status, travel_hod_approver)
    VALUES 
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18,
    $19, $20, $21, $22) RETURNING request_id
    `;

    // Insert params
    const insertParams = [
      email,
      name,
      employeeName,
      department,
      designation,
      destination,
      departureDate,
      returnDate,
      travelCategory,
      justification,
      travelMode,
      transportCost,
      otherCost,
      perDiem,
      totalCost,
      costCentre,
      withinBudget,
      approvalTier,
      hodStatus,
      hrStatus,
      directorStatus,
      hodApprover,
    ];

    // Run the query
    const result = await query(insertQuery, insertParams);

    // Get the returned uuid
    const requestUuid = result[0].request_id;

    // Running an update if the requestor is an HOD
    if (hodEmail === email) {
      const updateQuery = `
        UPDATE travel_requisitions
        SET 
        travel_hod_email = $1,
        travel_hod_approval_status = $2,
        travel_hod_comments = $3
        WHERE request_id = $4
        `;

      const updateParams = [
        hodEmail,
        "approved",
        "Automatic HOD Approval",
        requestUuid,
      ];
      await query(updateQuery, updateParams);

      if (approvalTier === "Tier 1") {
        EmailSender({
          to: email,
          requestId: requestUuid,
          message:
            "This is an automatic HOD approval for your travel requisition",
          title: "Final Update: Travel Requisition Approved",
          role: "user",
          showPdfDownload: true,
        });
      } else {
        // Send mail to HR Approvers
        HR_ARRAY.forEach((hrApprover) => {
          // Send Mail to HR
          EmailSender({
            to: hrApprover.email,
            requestId: requestUuid,
            message:
              "A new travel requisition has been submitted and requires your approval",
            title: "Action Required: New Travel Requisition",
            role: "HR",
            reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
          });
        });

        // Send confirmation email to HOD
        EmailSender({
          to: email,
          requestId: requestUuid,
          message:
            "Your travel requisition has been successfully submitted and forwarded to HR for approval",
          title: "Update: Travel requisition submitted successfully",
          role: "user",
        });
      }
    } else {
      // Normal workflow - Normal user (Send email to user and HOD)

      // HOD Send
      EmailSender({
        to: hodEmail,
        requestId: requestUuid,
        message:
          "A new travel requisition has been submitted and requires your approval",
        title: "Action Required: Travel Requisition Review",
        role: "HOD",
        reviewLink: `?token=${hodUuid}&stage=hod`,
      });

      // User Send
      EmailSender({
        to: email,
        requestId: requestUuid,
        message:
          "Your travel requisition has been submitted successfully and forwarded to the HOD for approval.",
        title: "Update: Travel Requisition Successfully Submitted",
        role: "user",
      });
    }

    // Return a success response
    return NextResponse.json(
      {
        message:
          "Your travel requisition has been submitted successfully, you will receive a confirmation email shortly",
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
