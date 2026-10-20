import { sendEmail } from "./EmailService";
import { AdvanceVerificationCodeTemplate } from "@/utils/templates/AdvanceVerificationCodeTemplate";
import { AdvanceRecordInactiveTemplate } from "@/utils/templates/AdvanceRecordInactiveTemplate";

export interface AdvanceVerificationEmailProps {
  to: string;
  staffName: string;
  code: string;
}

export async function AdvanceVerificationEmailSender({
  to,
  staffName,
  code,
}: AdvanceVerificationEmailProps) {
  const emailHtml = AdvanceVerificationCodeTemplate({ staffName, code });

  await sendEmail({
    from: process.env.ADVANCE_EMAIL_SENDER!,
    to,
    subject: "Your Salary Advance Verification Code",
    html: emailHtml,
  });
}

// Sent instead of a code when the record is deactivated (to the email on file)
export async function AdvanceRecordInactiveEmailSender({
  to,
  staffName,
}: Omit<AdvanceVerificationEmailProps, "code">) {
  await sendEmail({
    from: process.env.ADVANCE_EMAIL_SENDER!,
    to,
    subject: "Salary Advance: your staff record is inactive",
    html: AdvanceRecordInactiveTemplate({ staffName }),
  });
}
