"use server";
import { SalaryAdvanceFormData } from "@/components/SalaryAdvance/SalaryAdvanceClient";
import { query } from "@/lib/db";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";

export interface MessageResponse {
  type: "error" | "success";
  message: string;
}
export async function SubmitAdvanceForm(
  formData: SalaryAdvanceFormData,
): Promise<MessageResponse> {
  try {
    // FORM LOCKED CHECK
    // Get query for checking whether the form is locked
    const lockedResult = await query(
      "SELECT lock_advance_form FROM salary_advance_metadata ORDER BY id LIMIT 1",
    );
    const lockAdvanceSubmission = lockedResult[0]?.lock_advance_form === true;

    // Time check logic (EAT timezone assumed based on your server config, but Date() uses system local time)
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    // Beyond 5.00pm (17:00) on the 10th of the month
    const isPastDeadline =
      currentDay > 10 || (currentDay === 10 && currentHour >= 17);

    if (isPastDeadline && lockAdvanceSubmission) {
      return {
        type: "error",
        message: "Submission deadline has passed, please contact admin",
      };
    }

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
    } = formData;

    // RULE 1: Check if we have the staff info, if not - stop the submission
    const isExistingStaff = await query(
      `
      SELECT id FROM company_staff_data WHERE staff_number = $1
      `,
      [staffNumber],
    );

    if (isExistingStaff.length === 0) {
      return {
        type: "error",
        message:
          "Selected staff info could not be found, please contact your admin",
      };
    }

    // RULE 2: Check if the staff has already selected "continuous" in any previous request
    const continuousCheckRes = await query(
      `SELECT request_id FROM salary_advances 
           WHERE staff_number = $1 AND request_type = 'continuous' 
           LIMIT 1`,
      [staffNumber],
    );

    if (continuousCheckRes.length > 0) {
      return {
        type: "error",
        message:
          "You have a pre-existing continuous request on file. No further submissions are needed.",
      };
    }

    // RULE 3: Check if staff has already submitted a request THIS month
    const thisMonthCheckRes = await query(
      `SELECT request_id FROM salary_advances 
       WHERE staff_number = $1 
       AND EXTRACT(MONTH FROM request_created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM request_created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       LIMIT 1`,
      [staffNumber],
    );

    if (thisMonthCheckRes.length > 0) {
      return {
        type: "error",
        message:
          "You have already submitted a salary advance request for this month. Multiple advances are strictly not allowed.",
      };
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

    return {
      type: "success",
      message: "Your salary advance request has been submitted successfully.",
    };
  } catch (error) {
    console.error("Error submitting salary advance:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while processing your request.",
    };
  }
}
