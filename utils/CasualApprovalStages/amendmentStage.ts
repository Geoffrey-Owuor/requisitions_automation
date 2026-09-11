import { CasualEmailSender } from "@/services/CasualEmailSender";
import { loadHrArray } from "@/lib/loadAppDataV2";

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
  CasualEmailSender({
    to: userEmail,
    requestId: uuid,
    message:
      "Your amendment has been submitted successfully. This supersedes any earlier notification for this requisition and the approval workflow has restarted.",
    title: "Update: Casual Requisition Amended",
    role: "user",
  });

  if (selfHodAutoApproved) {
    const HR_ARRAY = await loadHrArray("casual");

    HR_ARRAY.forEach((hrApprover) => {
      CasualEmailSender({
        to: hrApprover.email,
        requestId: uuid,
        message: `This casual requisition was amended by ${amenderName} (who is also its HOD) and requires your approval. This supersedes any earlier notification for this requisition.`,
        title: "Action Required: Amended Casual Requisition",
        role: "HR",
        reviewLink: `?token=${hrApprover.uuid}&stage=hr`,
      });
    });
  } else {
    CasualEmailSender({
      to: hodEmail,
      requestId: uuid,
      message: `This casual requisition was amended by ${amenderName} and requires your approval. This supersedes any earlier notification for this requisition.`,
      title: "Action Required: Amended Casual Requisition",
      role: "HOD",
      reviewLink: `?token=${hodUuid}&stage=hod`,
    });
  }
}
