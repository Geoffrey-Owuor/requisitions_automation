import { dateFormatter } from "@/public/assets";
import {
  AdvanceDataProps,
  AdvanceMailTemplateValues,
} from "@/services/AdvanceEmailSender";

interface AdvanceRequisitionProps extends Omit<
  AdvanceDataProps,
  "to" | "requestId"
> {
  emailData: AdvanceMailTemplateValues;
}

export function AdvanceRequisitionTemplate({
  message,
  title,
  emailData,
}: AdvanceRequisitionProps) {
  const formattedDateSubmitted = dateFormatter(emailData.datesubmitted);
  const formattedRepaymentStart = dateFormatter(emailData.repaymentstartdate);

  // Format the amount with commas
  const formattedAmount = Number(emailData.requestamount).toLocaleString();

  // Capitalize request type
  const formattedRequestType =
    emailData.requesttype.charAt(0).toUpperCase() +
    emailData.requesttype.slice(1);

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <!-- Header: solid background avoids Outlook gradient rendering issues -->
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <table width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Human Resources</p>
                <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${title}</h2>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: inline-block; background-color: #7f1d1d; border-radius: 12px; padding: 8px 14px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f2d7d5; letter-spacing: 1px;">ADVANCE</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin: 24px 0;">

          <!-- Message box: explicit white avoids Outlook dark-mode unpredictability -->
          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #dbeafe;">
            <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">${message}</p>
          </div>

          <!-- Submission meta strip -->
          <div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid #f2d7d5;">
            <table width="100%">
              <tr>
                <td style="font-size: 11px; color: #a31d1d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Submitted by</td>
                <td style="font-size: 11px; color: #a31d1d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Date Submitted</td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px;">${emailData.staffname || "—"}</td>
                <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px; text-align: right;">${formattedDateSubmitted}</td>
              </tr>
            </table>
          </div>

          <!-- Employee Information -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Staff Information</p>
            <table width="100%" style="border-collapse: collapse;">
              ${advanceRow("Staff Name", emailData.staffname)}
              ${advanceRow("Staff Number", emailData.staffnumber)}
              ${advanceRow("Email Address", emailData.staffemail)}
              ${advanceRow("Department", emailData.staffdepartment)}
              ${advanceRow("Location", emailData.stafflocation)}
            </table>
          </div>

          <!-- Advance Details: dark solid box -->
          <div style="background-color: #0f172a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(30,58,138,0.3);">
            <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px;">Advance Details</p>
            <table width="100%">
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Request Amount</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Installments</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${emailData.installments}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Repayment Start</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${formattedRepaymentStart}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 0; font-size: 12px; color: #94a3b8;">Request Type</td>
                <td style="padding-bottom: 0; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${formattedRequestType}</td>
              </tr>
            </table>
          </div>

          <!-- Approval Workflow -->
          <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>

          <!-- Single column grid for Advance Approval -->
          <table width="100%" style="border-collapse: separate; border-spacing: 0 0; margin-bottom: 24px;">
            <tr>
              <td width="100%" style="vertical-align: top;">
                ${advanceStatusCard("Human Resources", emailData.approvalstatus, emailData.approvercomments)}
              </td>
            </tr>
          </table>

        </div>

        <!-- Footer: explicit white avoids near-white Outlook dark-mode issues -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Salary Advance Requisition</p>
        </div>

      </div>
    </div>
  `;

  return emailHtml;
}

/**
 * HELPER: ADVANCE INFO ROW
 */
function advanceRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; font-size: 12px; color: #5a3a3a; width: 40%; border-bottom: 1px solid #f7f0f0;">${label}</td>
      <td style="padding: 10px 0; font-size: 13px; color: #1a0f0f; font-weight: 500; border-bottom: 1px solid #f7f0f0;">${value || "—"}</td>
    </tr>`;
}

/**
 * HELPER: ADVANCE STATUS CARD
 */
function advanceStatusCard(title: string, status: string, comments: string) {
  const lower = (status || "pending").toLowerCase();

  let color = "#854d0e";
  let bg = "#fef9c3";
  let border = "1px solid #854d0e"; // Pending
  if (lower.includes("approved") || lower.includes("accepted")) {
    color = "#166534";
    bg = "#dcfce7";
    border = "1px solid #166534";
  }
  if (lower.includes("declined") || lower.includes("rejected")) {
    color = "#991b1b";
    bg = "#fee2e2";
    border = "1px solid #991b1b";
  }

  return `
    <div style="border-radius: 12px; border: 1px solid #f0e6e6; padding: 14px 16px; background-color: #ffffff;">
      <p style="margin: 0 0 8px; font-size: 10px; font-weight: 800; color: #5a3a3a; text-transform: uppercase; letter-spacing: 1px;">${title}</p>
      <span style="padding: 3px 9px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background-color: ${bg}; border: ${border}; text-transform: uppercase; display: inline-block;">${status || "Pending"}</span>
      <p style="margin: 8px 0 0; font-size: 12px; color: #5a3a3a; font-style: italic; background-color: #ffffff; padding: 6px 10px; border-radius: 8px; border: 1px dashed #eee;">"${comments || "Awaiting review"}"</p>
    </div>
  `;
}
