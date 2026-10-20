import { sendEmail } from "./EmailService";
import {
  EmailChangeAppliedNoticeTemplate,
  EmailChangeApprovedTemplate,
  EmailChangeHrTemplate,
  EmailChangeOnFileNoticeTemplate,
  EmailChangeOnFile,
  EmailChangeRejectedTemplate,
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

interface EmailChangeResolutionProps {
  staffName: string;
  requestedEmail: string;
  // The address an approval replaced, if any
  previousEmail?: string | null;
}

// Sent after HR approves (the change is already applied) or rejects a
// request. Approval tells both the new and the replaced address; the result
// is the email to the requested address.
export async function EmailChangeResolutionEmailSender(
  outcome: "approved" | "rejected",
  { staffName, requestedEmail, previousEmail }: EmailChangeResolutionProps,
) {
  const from = process.env.ADVANCE_EMAIL_SENDER!;

  if (outcome === "rejected") {
    return sendEmail({
      from,
      to: requestedEmail,
      subject: "Your Email Change Request",
      html: EmailChangeRejectedTemplate(staffName),
    });
  }

  const result = await sendEmail({
    from,
    to: requestedEmail,
    subject: "Your Staff Record Email Was Updated",
    html: EmailChangeApprovedTemplate(staffName, requestedEmail),
  });

  if (
    previousEmail &&
    previousEmail.toLowerCase() !== requestedEmail.toLowerCase()
  ) {
    await sendEmail({
      from,
      to: previousEmail,
      subject: "The Email On Your Staff Record Was Changed",
      html: EmailChangeAppliedNoticeTemplate(staffName, requestedEmail),
    });
  }

  return result;
}
