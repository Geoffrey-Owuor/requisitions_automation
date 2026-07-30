"use server";
import { query } from "@/lib/db";
import { MessageResponse } from "./SubmitAdvanceForm";
import {
  createAdvanceFormSession,
  AdvanceVerificationPayload,
} from "@/lib/advanceVerificationSession";

interface StaffDetails {
  staff_number: string;
  staff_name: string;
  staff_email: string;
  staff_department: string;
  staff_location: string;
}

export interface VerifyAdvanceCodeResponse extends MessageResponse {
  staff?: AdvanceVerificationPayload;
}

export async function VerifyAdvanceCode(
  email: string,
  code: string,
): Promise<VerifyAdvanceCodeResponse> {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedCode = code?.trim();

    if (!normalizedEmail || !normalizedCode) {
      return {
        type: "error",
        message: "Email and verification code are required.",
      };
    }

    const codeResult = await query<{ id: number }>(
      `SELECT id FROM verification_codes
       WHERE staff_email = $1 AND code = $2
       AND consumed = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, normalizedCode],
    );

    if (codeResult.length === 0) {
      return {
        type: "error",
        message: "Invalid or expired verification code.",
      };
    }

    await query(`UPDATE verification_codes SET consumed = true WHERE id = $1`, [
      codeResult[0].id,
    ]);

    const staffResult = await query<StaffDetails>(
      `SELECT staff_number, staff_name, staff_email, staff_department, staff_location
       FROM company_staff_data WHERE LOWER(staff_email) = $1 LIMIT 1`,
      [normalizedEmail],
    );

    if (staffResult.length === 0) {
      return {
        type: "error",
        message: "Staff record could not be found, please contact HR.",
      };
    }

    const staff = staffResult[0];
    const payload: AdvanceVerificationPayload = {
      staffNumber: staff.staff_number,
      staffName: staff.staff_name,
      staffEmail: staff.staff_email,
      department: staff.staff_department,
      location: staff.staff_location,
    };

    await createAdvanceFormSession(payload);

    return {
      type: "success",
      message: "Verification successful.",
      staff: payload,
    };
  } catch (error) {
    console.error("Error verifying advance code:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while processing your request.",
    };
  }
}
