"use server";
import { randomInt } from "crypto";
import { query } from "@/lib/db";
import { MessageResponse } from "./SubmitAdvanceForm";
import { AdvanceVerificationEmailSender } from "@/services/AdvanceVerificationEmailSender";

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const GENERIC_RESPONSE: MessageResponse = {
  type: "success",
  message:
    "If this email is associated with a staff account on file, a verification code has been sent. It will expire in 10 minutes.",
};

interface StaffLookup {
  staff_name: string;
  staff_email: string;
}

export async function RequestVerificationCode(
  email: string,
): Promise<MessageResponse> {
  try {
    const normalizedEmail = email?.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return {
        type: "error",
        message: "Please enter a valid email address.",
      };
    }

    const staffResult = await query<StaffLookup>(
      `SELECT staff_name, staff_email FROM company_staff_data WHERE LOWER(staff_email) = $1 LIMIT 1`,
      [normalizedEmail],
    );

    // Anti-enumeration: always respond identically whether or not the email matched.
    if (staffResult.length === 0) {
      return GENERIC_RESPONSE;
    }

    const staff = staffResult[0];

    // Silent cooldown: if a still-valid code was requested moments ago, don't send another.
    const recentCodeResult = await query(
      `SELECT id FROM verification_codes
       WHERE staff_email = $1 AND consumed = false
       AND created_at > NOW() - INTERVAL '${RESEND_COOLDOWN_SECONDS} seconds'
       LIMIT 1`,
      [staff.staff_email.toLowerCase()],
    );

    if (recentCodeResult.length > 0) {
      return GENERIC_RESPONSE;
    }

    const code = randomInt(100000, 1000000).toString();

    await query(
      `INSERT INTO verification_codes (staff_email, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes')`,
      [staff.staff_email.toLowerCase(), code],
    );

    await AdvanceVerificationEmailSender({
      to: staff.staff_email,
      staffName: staff.staff_name,
      code,
    });

    return GENERIC_RESPONSE;
  } catch (error) {
    console.error("Error requesting verification code:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while processing your request.",
    };
  }
}
