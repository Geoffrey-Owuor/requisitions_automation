import { query } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      staffNumber,
      staffName,
      staffEmail,
      department,
      location,
      requestAmount,
      installments,
      repaymentStartDate,
      requestType,
    } = body;

    // RULE 1: Check if the staff has already selected "continuous" in any previous request
    const continuousCheckRes = await query(
      `SELECT request_id FROM salary_advances 
       WHERE staff_number = $1 AND request_type = 'continuous' 
       LIMIT 1`,
      [staffNumber],
    );

    if (continuousCheckRes.length > 0) {
      return NextResponse.json(
        {
          message:
            "You have a pre-existing continuous request on file. No further submissions are needed.",
        },
        { status: 400 },
      );
    }

    // RULE 2: Check if staff has already submitted a request THIS month
    const thisMonthCheckRes = await query(
      `SELECT request_id FROM salary_advances 
       WHERE staff_number = $1 
       AND EXTRACT(MONTH FROM request_created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM request_created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       LIMIT 1`,
      [staffNumber],
    );

    if (thisMonthCheckRes.length > 0) {
      return NextResponse.json(
        {
          message:
            "You have already submitted a salary advance request for this month. Multiple advances are strictly not allowed.",
        },
        { status: 400 },
      );
    }

    // Insert new request if all checks pass
    const result = await query(
      `INSERT INTO salary_advances (
        staff_number, staff_name, staff_email, staff_department, staff_location, 
        request_amount, no_of_installments, repayment_start_date, request_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING request_id`,
      [
        staffNumber,
        staffName,
        staffEmail,
        department,
        location,
        Number(requestAmount),
        Number(installments),
        repaymentStartDate,
        requestType,
      ],
    );

    // Get the request id
    const requestId = result[0].request_id;

    // Send a notification email to the staff
    AdvanceEmailSender({
      to: staffEmail,
      requestId: requestId,
      message:
        "Your salary advance requisition has been submitted successfully, you will be notified by HR once it has been approved and processed. If you did not request this, kindly contact HR for inquiry",
      title: "Salary Advance Request Submitted Successfully",
    });

    return NextResponse.json(
      {
        message: "Your salary advance request has been submitted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error submitting salary advance:", error);
    return NextResponse.json(
      {
        message:
          "An internal server error occurred while processing your request.",
      },
      { status: 500 },
    );
  }
}
