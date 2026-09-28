import { sendEmail } from "./EmailService";
import {
  EmailChangeHrTemplate,
  EmailChangeOnFileNoticeTemplate,
  EmailChangeOnFile,
  EmailChangeRequesterTemplate,
  EmailChangeSubmission,
} from "@/utils/templates/EmailChangeRequestTemplate";

interface EmailChangeEmailProps {
  submission: EmailChangeSubmission;
  onFile: EmailChangeOnFile;
}

// Three separate sends so on-file data only ever reaches HR/admin and the
// current mailbox owner, never the (unverified) requested address.
export async function EmailChangeRequestEmailSender({
  submission,
  onFile,
}: EmailChangeEmailProps) {
  const from = process.env.ADVANCE_EMAIL_SENDER!;

  // HR + admin: the one that matters. Deliberately no replyTo (see template).
  const hrResult = await sendEmail({
    from,
    to: [
      process.env.FIRST_HR_EMAIL!,
      process.env.SECOND_HR_EMAIL!,
      process.env.ADMIN_EMAIL!,
    ],
    subject: `Email Change Request - ${submission.staffName} (${submission.staffNumber})`,
    html: EmailChangeHrTemplate(submission, onFile),
  });

  // Secondary sends: failures are logged inside sendEmail and don't fail the request.
  await sendEmail({
    from,
    to: submission.requestedEmail,
    replyTo: submission.requestedEmail,
    subject: "Your Email Change Request",
    html: EmailChangeRequesterTemplate(submission),
  });

  if (
    onFile.staffFound &&
    onFile.email &&
    onFile.email.toLowerCase() !== submission.requestedEmail.toLowerCase()
  ) {
    await sendEmail({
      from,
      to: onFile.email,
      subject: "Email Change Requested On Your Staff Record",
      html: EmailChangeOnFileNoticeTemplate(
        onFile.staffName ?? submission.staffName,
        submission,
      ),
    });
  }

  return hrResult;
}
