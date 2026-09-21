"use server";
import { headers } from "next/headers";
import { query } from "@/lib/db";
import { MessageResponse } from "./SubmitAdvanceForm";
import {
  EMAIL_CHANGE_RATE_LIMIT,
  EMAIL_CHANGE_REASONS,
  EmailChangeRequestInput,
} from "@/lib/emailChangeRequest";
import { EmailChangeRequestEmailSender } from "@/services/EmailChangeRequestEmailSender";

const SUCCESS_RESPONSE: MessageResponse = {
  type: "success",
  message:
    "Your email change request has been submitted. HR will review it and may contact you to confirm your identity.",
};

interface StaffLookup {
  staff_name: string;
  staff_email: string;
  staff_department: string;
}

// Public, unauthenticated: the requester only proves they know a staff
// number. Nothing here changes company_staff_data; HR acts on the emails.
export async function SubmitEmailChangeRequest(
  input: EmailChangeRequestInput,
): Promise<MessageResponse> {
  try {
    // Honeypot: pretend it worked so bots learn nothing.
    if (input.website?.trim()) return SUCCESS_RESPONSE;

    const staffNumber = input.staffNumber?.trim();
    const staffName = input.staffName?.trim();
    const department = input.department?.trim();
    const reason = input.reason?.trim();
    const newEmail = input.newEmail?.trim().toLowerCase();
    const confirmEmail = input.confirmEmail?.trim().toLowerCase();

    if (!staffNumber || !staffName || !department || !reason || !newEmail) {
      return { type: "error", message: "Please fill in all required fields." };
    }

    if (
      staffNumber.length > 50 ||
      staffName.length > 255 ||
      department.length > 255 ||
      newEmail.length > 255
    ) {
      return { type: "error", message: "One or more fields are too long." };
    }

    if (!(EMAIL_CHANGE_REASONS as readonly string[]).includes(reason)) {
      return { type: "error", message: "Please choose a valid reason." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return { type: "error", message: "Please enter a valid email address." };
    }

    if (newEmail !== confirmEmail) {
      return { type: "error", message: "The email addresses do not match." };
    }

    if (!input.ownershipConfirmed) {
      return {
        type: "error",
        message: "Please confirm that you own the new email address.",
      };
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;
    const userAgent = headersList.get("user-agent")?.slice(0, 500) ?? null;

    const { windowMinutes, maxPerIp, maxPerStaffNumber, duplicateWindowHours } =
      EMAIL_CHANGE_RATE_LIMIT;

    if (ipAddress) {
      const ipCount = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM email_change_requests
         WHERE ip_address = $1
         AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
        [ipAddress],
      );
      if (parseInt(ipCount[0].count, 10) >= maxPerIp) {
        return {
          type: "error",
          message: "Too many requests. Please try again later.",
        };
      }
    }

    const staffCount = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM email_change_requests
       WHERE staff_number = $1
       AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
      [staffNumber],
    );
    if (parseInt(staffCount[0].count, 10) >= maxPerStaffNumber) {
      return {
        type: "error",
        message: "Too many requests. Please try again later.",
      };
    }

    const openRequest = await query(
      `SELECT id FROM email_change_requests
       WHERE staff_number = $1 AND status = 'open'
       AND created_at > NOW() - INTERVAL '${duplicateWindowHours} hours'
       LIMIT 1`,
      [staffNumber],
    );
    if (openRequest.length > 0) {
      return {
        type: "error",
        message:
          "A request for this staff number is already being processed. Please wait for HR to contact you.",
      };
    }

    const staffResult = await query<StaffLookup>(
      `SELECT staff_name, staff_email, staff_department
       FROM company_staff_data WHERE staff_number = $1 LIMIT 1`,
      [staffNumber],
    );
    const staff = staffResult[0];

    // Unknown staff numbers are accepted and flagged to HR, so the response
    // never reveals which staff numbers exist.
    const inserted = await query<{ id: number }>(
      `INSERT INTO email_change_requests
        (staff_number, staff_name, department, reason, requested_email,
         staff_found, on_file_email, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        staffNumber,
        staffName,
        department,
        reason,
        newEmail,
        !!staff,
        staff?.staff_email ?? null,
        ipAddress,
        userAgent,
      ],
    );

    const emailResult = await EmailChangeRequestEmailSender({
      submission: {
        staffNumber,
        staffName,
        department,
        reason,
        requestedEmail: newEmail,
        submittedAt: new Date().toLocaleString("en-KE", {
          timeZone: "Africa/Nairobi",
        }),
      },
      onFile: {
        staffFound: !!staff,
        staffName: staff?.staff_name,
        department: staff?.staff_department,
        email: staff?.staff_email,
      },
    });

    if (!emailResult.success) {
      // HR never got it: drop the row so the duplicate check doesn't block a retry.
      await query(`DELETE FROM email_change_requests WHERE id = $1`, [
        inserted[0].id,
      ]);
      return {
        type: "error",
        message:
          "We could not send your request. Please try again in a few minutes.",
      };
    }

    return SUCCESS_RESPONSE;
  } catch (error) {
    console.error("Error submitting email change request:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while processing your request.",
    };
  }
}
