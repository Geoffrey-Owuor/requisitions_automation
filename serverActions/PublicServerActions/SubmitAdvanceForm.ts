"use server";
import { SalaryAdvanceFormData } from "@/components/SalaryAdvance/SalaryAdvanceClient";
import { query } from "@/lib/db";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";
import { getAdvanceFormSession } from "@/lib/advanceVerificationSession";
import {
  getBlockingActiveAdvance,
  getInstallmentCompletionDate,
} from "@/lib/salaryAdvanceRules";

export interface MessageResponse {
  type: "error" | "success";
  message: string;
}
export async function SubmitAdvanceForm(
  formData: SalaryAdvanceFormData,
): Promise<MessageResponse> {
  try {
    // Staff identity must come from a verified email+code session, never from client-submitted fields.
    const verifiedStaff = await getAdvanceFormSession();

    if (!verifiedStaff) {
      return {
        type: "error",
        message:
          "Your verification session has expired. Please verify your email again.",
      };
    }

    const { staffNumber, staffName, staffEmail, department, location } =
      verifiedStaff;
    const { requestAmount, repaymentStartDate, requestType } = formData;

    // Continuous requests are always repaid in a single installment —
    // enforced here too, not just on the client.
    const installments =
      requestType === "continuous" ? "1" : formData.installments;

    // RULE 2: Block submission while the staff has an active continuous
    // request (never completes), or an active one-off request whose
    // installment period hasn't elapsed yet. Declined requests don't block.
    const blockingAdvance = await getBlockingActiveAdvance(staffNumber);

    if (blockingAdvance) {
      if (blockingAdvance.requestType === "continuous") {
        return {
          type: "error",
          message:
            "You have a pre-existing continuous request on file. No further submissions are needed.",
        };
      }

      const completionDate = getInstallmentCompletionDate(
        blockingAdvance.repaymentStartDate,
        blockingAdvance.noOfInstallments,
      );
      return {
        type: "error",
        message: `You have an active salary advance request whose repayment installments are not yet complete. You can submit a new request once installments are complete on ${completionDate.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}.`,
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

    // Delete any verification codes tied to this user - no longer needed
    await query(`DELETE FROM verification_codes WHERE staff_email = $1`, [
      staffEmail,
    ]);

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
