import { EmailSender } from "@/services/EmailSender";
import { loadHrArray } from "@/lib/loadApprovers";
import { loadHodAlternates } from "@/lib/hodAssignment";

type AmendmentStageProps = {
  uuid: string;
  userEmail: string;
  amenderName: string;
  hodEmail: string;
  hodUuid: string;
  // True when the re-resolved HOD is the submitter themself - mirrors the
  // self-HOD auto-approve branch in the initial submission route, so HR is
  // notified directly instead of the (self-)HOD.
  selfHodAutoApproved: boolean;
};

export async function amendmentStage({
  uuid,
  userEmail,
  amenderName,
  hodEmail,
  hodUuid,
  selfHodAutoApproved,
}: AmendmentStageProps) {
  // Submitter confirmation
  EmailSender({
    to: userEmail,
    requestId: uuid,
    message:
      "Your amendment has been submitted successfully. This supersedes any earlier notification for this requisition and the approval workflow has restarted.",
    title: "Update: Travel Requisition Amended",
    role: "user",
  });

  if (selfHodAutoApproved) {
    const HR_ARRAY = await loadHrArray("travel");

    HR_ARRAY.forEach((hrApprover) => {
      EmailSender({
        to: hrApprover.email,
        requestId: uuid,
        message: `This travel requisition was amended by ${amenderName} (who is also its HOD) and requires your approval. This supersedes any earlier notification for this requisition.`,
        title: "Action Required: Amended Travel Requisition",
        role: "HR",
        reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
      });
    });
  } else {
    EmailSender({
      to: hodEmail,
      requestId: uuid,
      message: `This travel requisition was amended by ${amenderName} and requires your approval. This supersedes any earlier notification for this requisition.`,
      title: "Action Required: Amended Travel Requisition",
      role: "HOD",
      reviewLink: `?token=${hodUuid}&stage=hod`,
    });

    // The HOD's alternates can also act on the HOD stage (first click wins)
    const hodAlternates = await loadHodAlternates(hodEmail, userEmail);
    hodAlternates.forEach((alternate) => {
      EmailSender({
        to: alternate.email,
        requestId: uuid,
        message: `This travel requisition was amended by ${amenderName} and requires your approval as an alternate HOD approver. This supersedes any earlier notification for this requisition.`,
        title: "Action Required: Amended Travel Requisition",
        role: "HOD",
        reviewLink: `?token=${alternate.uuid}&stage=hod`,
      });
    });
  }
}
