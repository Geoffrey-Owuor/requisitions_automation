import { sendEmail } from "./EmailService";
import { AdvanceVerificationCodeTemplate } from "@/utils/templates/AdvanceVerificationCodeTemplate";

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
