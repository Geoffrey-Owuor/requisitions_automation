import {
  CasualEmailSender,
  getCasualEmailData,
} from "@/services/CasualEmailSender";
import { renderToBuffer } from "@react-pdf/renderer";
import { CasualRequisitionPdf } from "@/components/Approvers/CasualApprovers/pdf/CasualRequisitionPdf";

type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export async function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
}: HrApprovalStageProps) {
  if (status === "declined") {
    // Hr
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: "You have declined this casual requisition.",
      title: "Final Update: Casual Requisition Declined",
      role: "user",
    });

    if (hodEmail === userEmail) {
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "This casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    } else {
      CasualEmailSender({
        to: hodEmail,
        requestId: uuid,
        message:
          "This casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });

      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message:
          "Your casual requisition has been declined in the HR approval stage",
        title: `Final Update: Casual Requisition Declined By ${approverName}`,
        role: "user",
      });
    }
  }

  if (status === "approved") {
    const externalProvider = process.env.EXTERNAL_CASUAL_PROVIDER!;

    // Generate the PDF summary once - attached only to the HR and external provider emails
    const emailData = await getCasualEmailData(uuid);
    const pdfBuffer = await renderToBuffer(
      <CasualRequisitionPdf pdfData={emailData} />,
    );
    const pdfAttachment = [
      { filename: `Casual_Requisition_${uuid}.pdf`, content: pdfBuffer },
    ];

    // Hr - the approver's own confirmation, with the pdf attached
    CasualEmailSender({
      to: approverEmail,
      requestId: uuid,
      message: `You have approved this casual requisition. A copy of the requisition details and PDF attachment has also been sent to ${externalProvider} for their action.`,
      title: "Final Update: Casual Requisition Approved",
      role: "user",
      showPdfDownload: true,
      attachments: pdfAttachment,
    });

    if (hodEmail === userEmail) {
      // Submitter (who is also the HOD)
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `This casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    } else {
      // Hod
      CasualEmailSender({
        to: hodEmail,
        requestId: uuid,
        message: `This casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
      // User
      CasualEmailSender({
        to: userEmail,
        requestId: uuid,
        message: `Your casual requisition has been approved by ${approverName}`,
        title: `Final Update: Casual Requisition Approved By ${approverName}`,
        role: "user",
        showPdfDownload: true,
      });
    }

    // External casual labor provider - informed for action, with the pdf attached
    CasualEmailSender({
      to: externalProvider,
      requestId: uuid,
      message:
        "A new casual requisition has been approved and requires your attention for action",
      title: "Action Required: New Casual Requisition",
      role: "user",
      attachments: pdfAttachment,
    });
  }
}
