import { dateFormatter } from "@/public/assets";
import { ITDataProps, ITMailTemplateValues } from "@/services/ITEmailSender";
import { BASE_URL } from "@/public/assets";

interface ITRequisitionProps extends Omit<ITDataProps, "to"> {
  emailData: ITMailTemplateValues;
}

export function ITRequisitionTemplate({
  requestId,
  message,
  title,
  role,
  emailData,
  reviewLink,
}: ITRequisitionProps) {
  const formattedDateSubmitted = dateFormatter(emailData.datesubmitted);
  const formattedRequisitionDate = dateFormatter(emailData.requisitiondate);
  const formattedDateJoining = dateFormatter(emailData.datejoining);

  const buttonStyle =
    role !== "user" ? "display: inline-block;" : "display: none;";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <!-- Header: solid background avoids Outlook gradient rendering issues -->
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <table width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">IT Department</p>
                <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${title}</h2>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: inline-block; background-color: #7f1d1d; border-radius: 12px; padding: 8px 14px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f2d7d5; letter-spacing: 1px;">IT</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style = "margin: 24px 0;">

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
                <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px;">${emailData.submittername || "—"}</td>
                <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px; text-align: right;">${formattedDateSubmitted}</td>
              </tr>
            </table>
          </div>

          <!-- Employee Information -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Employee Information</p>
            <table width="100%" style="border-collapse: collapse;">
              ${itRow("Employee Name", emailData.employeename)}
              ${itRow("Staff Number", emailData.employeestaffnumber)}
              ${itRow("Department", emailData.employeedepartment)}
              ${itRow("Date Joining", formattedDateJoining)}
              ${itRow("Requisition Date", formattedRequisitionDate)}
            </table>
          </div>

          <!-- Equipment Details: dark solid box (same gradient-avoidance fix as Travel) -->
          <div style="background-color: #0f172a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(30,58,138,0.3);">
            <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px;">Equipment Details</p>
            <table width="100%">
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Request Type</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${emailData.replacementnew || "—"}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8; vertical-align: top;">Requirements</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${emailData.requirements || "—"}</td>
              </tr>
              ${
                emailData.otherrequirements
                  ? `<tr>
                <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
                  <p style="margin: 0 0 4px; font-size: 10px; font-weight: 700; color: #f87171; text-transform: uppercase; letter-spacing: 1px;">Additional Requirements</p>
                  <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5; overflow-wrap: break-word; white-space: pre-wrap;">${emailData.otherrequirements}</p>
                </td>
              </tr>`
                  : ""
              }
            </table>
          </div>

          <!-- Approval Workflow -->
          <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>

          <!-- Two-column grid via table for Outlook compatibility -->
          <table width="100%" style="border-collapse: separate; border-spacing: 0 0; margin-bottom: 24px;">
            <tr>
              <td width="49%" style="vertical-align: top; padding-right: 8px;">
                ${itStatusCard("Head of Department", emailData.hodapprovalstatus, emailData.hodapprover, emailData.hodcomments)}
              </td>
              <td width="2%"></td>
              <td width="49%" style="vertical-align: top;">
                ${itStatusCard("IT Department", emailData.itapprovalstatus, emailData.itapprover, emailData.itcomments)}
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <div style="margin-top: 32px; text-align: center;">
            <div style="${buttonStyle}">
              <a href="${BASE_URL}/itapproval/${requestId}${reviewLink ?? ""}" style="background-color: #a31d1d; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">Review Requisition</a>
            </div>
          </div>

        </div>

        <!-- Footer: explicit white avoids near-white Outlook dark-mode issues -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | IT Requisition</p>
        </div>

      </div>
    </div>
  `;

  return emailHtml;
}

/**
 * HELPER: IT INFO ROW
 * Uses blue-toned label colours instead of the red family used in Travel.
 * Darker label (#334155) ensures contrast on light backgrounds in Outlook dark mode.
 */
function itRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; font-size: 12px; color: #5a3a3a; width: 40%; border-bottom: 1px solid #f7f0f0;">${label}</td>
      <td style="padding: 10px 0; font-size: 13px; color: #1a0f0f; font-weight: 500; border-bottom: 1px solid #f7f0f0;">${value || "—"}</td>
    </tr>`;
}

/**
 * HELPER: IT STATUS CARD
 * Compact card designed for side-by-side (two-column) layout.
 * Badge borders match text colour for Outlook dark-mode resilience (same fix as Travel).
 */
function itStatusCard(
  title: string,
  status: string,
  name: string,
  comments: string,
) {
  const lower = (status || "").toLowerCase();

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
      <p style="margin: 0 0 2px; font-size: 10px; font-weight: 800; color: #5a3a3a; text-transform: uppercase; letter-spacing: 1px;">${title}</p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #1a0f0f; font-weight: 600;">${name || "Awaiting Assignment"}</p>
      <span style="padding: 3px 9px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background-color: ${bg}; border: ${border}; text-transform: uppercase; display: inline-block;">${status || "Pending"}</span>
      <p style="margin: 8px 0 0; font-size: 12px; color: #5a3a3a; font-style: italic; background-color: #ffffff; padding: 6px 10px; border-radius: 8px; border: 1px dashed #eee;">"${comments || "N/A"}"</p>
    </div>
  `;
}
