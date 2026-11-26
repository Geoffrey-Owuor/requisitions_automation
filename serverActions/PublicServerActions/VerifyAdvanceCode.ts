"use server";
import { timingSafeEqual } from "crypto";
import { pool, query } from "@/lib/db";
import { MessageResponse } from "./SubmitAdvanceForm";
import {
  createAdvanceFormSession,
  AdvanceVerificationPayload,
} from "@/lib/advanceVerificationSession";

const MAX_ATTEMPTS = 5;

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

    // Only the newest unused code counts, and a wrong guess uses up one of
    // its MAX_ATTEMPTS (migration 043). Locked, so guesses sent at once
    // can't share the last attempt.
    const client = await pool.connect();
    let verdict: "ok" | "expired" | "wrong" | "locked";
    let attemptsLeft = 0;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{
        id: number;
        code: string;
        attempts: number;
        live: boolean;
      }>(
        `SELECT id, code, attempts, expires_at > NOW() AS live
         FROM verification_codes
         WHERE staff_email = $1 AND consumed = false
         ORDER BY created_at DESC LIMIT 1
         FOR UPDATE`,
        [normalizedEmail],
      );
      const row = rows[0];
      if (!row || !row.live) {
        verdict = "expired";
      } else {
        const matches =
          row.code.length === normalizedCode.length &&
          timingSafeEqual(Buffer.from(row.code), Buffer.from(normalizedCode));
        const attempts = row.attempts + 1;
        attemptsLeft = MAX_ATTEMPTS - attempts;
        verdict = matches ? "ok" : attemptsLeft > 0 ? "wrong" : "locked";
        await client.query(
          `UPDATE verification_codes SET attempts = $2, consumed = $3
           WHERE id = $1`,
          [row.id, attempts, verdict !== "wrong"],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (verdict === "expired") {
      return {
        type: "error",
        message: "Invalid or expired verification code.",
      };
    }
    if (verdict === "locked") {
      return {
        type: "error",
        message: "Too many wrong attempts. Please request a new code.",
      };
    }
    if (verdict === "wrong") {
      return {
        type: "error",
        message: `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
      };
    }

    const staffResult = await query<StaffDetails>(
      `SELECT staff_number, staff_name, staff_email, staff_department, staff_location
       FROM company_staff_data
       WHERE LOWER(staff_email) = $1 AND deactivated_at IS NULL LIMIT 1`,
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
