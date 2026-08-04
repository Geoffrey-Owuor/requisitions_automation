import {
  CasualEmailDataValues,
  CasualEmailDataProps,
} from "@/services/CasualEmailSender";
import { dateFormatter } from "@/public/assets";
import { BASE_URL } from "@/public/assets";

interface CasualRequisitionProps extends Omit<CasualEmailDataProps, "to"> {
  emailData: CasualEmailDataValues;
}

export function CasualRequisitionTemplate({
  requestId,
  message,
  title,
  role,
  emailData,
  reviewLink,
  showPdfDownload,
}: CasualRequisitionProps) {
  const formattedPeriodFrom = dateFormatter(emailData.periodfrom);
  const formattedPeriodTo = dateFormatter(emailData.periodto);

  const buttonStyle =
    role !== "user" ? "display: inline-block;" : "display: none;";
  const pdfButtonStyle = showPdfDownload
    ? "display: inline-block; margin-top: 10px;"
    : "display: none;";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
           <table width="100%">
             <tr>
               <td style="vertical-align: middle;">
                 <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.8;">Casual Requisition</p>
                 <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${title}</h2>
               </td>
               <td style="text-align: right; vertical-align: middle;">
                <div style="display: inline-block; background-color: #7f1d1d; border-radius: 12px; padding: 8px 14px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f2d7d5; letter-spacing: 1px;">CASUAL</p>
                </div>
              </td>
             </tr>
           </table>
        </div>

        <div style = "margin: 24px 0;">

          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #f9e8e8;">
            <p style="margin: 0; font-size: 15px; color: #4a3a3a; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Primary Information</p>
            <table width="100%" style="border-collapse: collapse;">
              ${modernRow("Submitter", emailData.submittername)}
              ${modernRow("Email", emailData.emailaddress)}
              ${modernRow("Department", emailData.department)}
              ${modernRow("Location", emailData.location)}
              ${modernRow("Engagement Period", `${formattedPeriodFrom} - ${formattedPeriodTo} (${emailData.engagementdays} day(s))`)}
              ${modernRow("Number of Casuals", String(emailData.numberofcasuals))}
              ${emailData.hrapprovedcasuals !== null && emailData.hrapprovedcasuals !== undefined ? modernRow("HR Approved Casuals", String(emailData.hrapprovedcasuals)) : ""}
              ${modernRow("PPEs Required", emailData.ppesrequired)}
              ${modernRow("Justification", emailData.justification)}
            </table>
          </div>

          <div style="background-color: #2c1a1a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(163,29,29,0.2);">
            <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">Rate Summary</p>
            <table width="100%">
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #c9a8a8;">Rate / Day</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${Number(emailData.rateperday).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #c9a8a8;">Engagement Days</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${emailData.engagementdays}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                  <table width="100%">
                    <tr>
                      <td style="font-size: 14px; font-weight: 700; color: #f2d7d5;">Total Amount</td>
                      <td style="font-size: 20px; font-weight: 700; color: #ffffff; text-align: right;">KES ${Number(emailData.totalamount).toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>
          <div style="border-radius: 16px; border: 1px solid #f0e6e6; overflow: hidden;">
             ${statusCard("Head of Department", emailData.hodapprovalstatus, emailData.hodapprover, emailData.hodemail, emailData.hodcomments)}
             ${statusCard("Finance", emailData.financeapprovalstatus, emailData.financeapprover, emailData.financeemail, emailData.financecomments)}
             ${statusCard("Human Resources", emailData.hrapprovalstatus, emailData.hrapprover, emailData.hremail, emailData.hrcomments, true)}
          </div>

          <div style="margin-top: 32px; text-align: center;">
            <div style="${buttonStyle}">
              <a href="${BASE_URL}/casualapproval/${requestId}${reviewLink}" style="background-color: #a31d1d; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">Review Requisition</a>
            </div>
            <div style="${pdfButtonStyle} width: 100%;">
              <a href="${BASE_URL}/dashboard/casualpdf/${requestId}" style="color: #a31d1d; font-size: 12px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 12px;">Download PDF Summary</a>
            </div>
          </div>

        </div>

        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #8c7474; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Casual Requisition</p>
        </div>
      </div>
    </div>
  `;

  return emailHtml;
}

/** * HELPER: MODERN CLEAN ROW
 */
function modernRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; font-size: 12px; color: #5a3a3a; width: 35%; border-bottom: 1px solid #f7f0f0;">${label}</td>
      <td style="padding: 10px 0; font-size: 13px; color: #1a0f0f; font-weight: 500; border-bottom: 1px solid #f7f0f0;">${value || "—"}</td>
    </tr>`;
}

/**
 * HELPER: STATUS CARD (INTEGRATED)
 */
function statusCard(
  title: string,
  status: string,
  name: string,
  email: string,
  comments: string,
  isLast = false,
) {
  const lower = (status || "").toLowerCase();

  let color = "#856404";
  let bg = "#fff3cd";
  let border = "1px solid #856404"; // Pending
  if (lower.includes("approved")) {
    color = "#155724";
    bg = "#d4edda";
    border = "1px solid #155724";
  }
  if (lower.includes("declined")) {
    color = "#721c24";
    bg = "#f8d7da";
    border = "1px solid #721c24";
  }

  return `
    <div style="padding: 16px; border-bottom: ${isLast ? "none" : "1px solid #f0e6e6"}; background-color: #ffffff;">
      <table width="100%">
        <tr>
          <td>
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #5a3a3a; text-transform: uppercase;">${title}</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${name || "Awaiting Assignment"}</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${email || "Awaiting Assignment"}</p>
          </td>
          <td style="text-align: right;">
            <span style="padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background-color: ${bg}; border: ${border}; text-transform: uppercase;">${status || "Pending"}</span>
          </td>
        </tr>
      </table>
      ${comments ? `<p style="margin: 8px 0 0; font-size: 12px; color: #5a3a3a; font-style: italic; background-color: #ffffff; padding: 8px; border-radius: 8px; border: 1px dashed #eee;">"${comments}"</p>` : ""}
    </div>
  `;
}
