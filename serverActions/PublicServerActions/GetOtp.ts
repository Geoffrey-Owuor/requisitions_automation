"use server";
import { MessageResponse } from "./SubmitAdvanceForm";
import { query } from "@/lib/db";

export async function GetOtp(otp: string): Promise<MessageResponse> {
  try {
    if (!otp) {
      return {
        type: "error",
        message: "Otp is required",
      };
    }

    const result = await query(
      `SELECT salary_advance_otp 
             FROM salary_advance_metadata 
             ORDER BY id 
             LIMIT 1`,
    );

    // Check if metadata row exists
    if (result.length === 0) {
      return {
        type: "error",
        message: "System configuration error: OTP not set up",
      };
    }

    const currentActiveOtp = result[0].salary_advance_otp;

    // Compare the provided OTP with the database OTP
    // Using loose equality or converting both to strings to avoid Int vs String type mismatches
    if (String(otp) === String(currentActiveOtp)) {
      return { type: "success", message: "OTP verified successfully" };
    } else {
      return { type: "error", message: "Invalid OTP provided" };
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      type: "error",
      message: "An error occurred while verifying the OTP",
    };
  }
}
