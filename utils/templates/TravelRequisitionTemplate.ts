import { EmailDataValues } from "@/services/EmailSender";
import { dateFormatter } from "@/public/assets";
import { EmailDataProps } from "@/services/EmailSender";

const PDF_WEB_APP_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface TravelRequisitionProps extends EmailDataProps {
  emailData: EmailDataValues;
}

export function TravelRequisitionTemplate({
  requestId,
  message,
  title,
  role,
  emailData,
  reviewLink,
  showPdfDownload,
}: TravelRequisitionProps) {
  const formattedDepartureDate = dateFormatter(emailData.departureDate);
  const formattedReturnDate = dateFormatter(emailData.returnDate);

  const buttonStyle =
    role !== "user" ? "display: inline-block;" : "display: none;";
  const pdfButtonStyle = showPdfDownload
    ? "display: inline-block; margin-top: 10px;"
    : "display: none;";

  // The major template
  const emailHtml = `
    <div style="background-color: #fcfafb; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(163,29,29,0.08); border: 1px solid #f2eaea;">
        
        <div style="background: linear-gradient(135deg, #a31d1d 0%, #7a1515 100%); padding: 24px 30px; border-bottom: 4px solid #f2d7d5;">
           <table width="100%">
             <tr>
               <td style="vertical-align: middle;">
                 <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.8;">New Requisition</p>
                 <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${title}</h2>
               </td>
               
             </tr>
           </table>
        </div>

        <div style="padding: 30px 24px;">
          
          <div style="background-color: #fdf6f6; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #f9e8e8;">
            <p style="margin: 0; font-size: 15px; color: #4a3a3a; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Primary Information</p>
            <table width="100%" style="border-collapse: collapse;">
              ${modernRow("Employee", emailData.employeeName)}
              ${modernRow("Email", emailData.emailAddress)}
              ${modernRow("Department", emailData.department)}
              ${modernRow("Designation", emailData.designation)}
              ${modernRow("Destination", emailData.destination)}
              ${modernRow("Travel Category", emailData.travelCategory)}
              ${modernRow("Travel Dates", `${formattedDepartureDate} - ${formattedReturnDate}`)}
              ${modernRow("Transport Mode", emailData.modeOfTransport)}
              ${modernRow("Business Justification", emailData.businessJustification)}
              ${modernRow("Cost Centre", emailData.costCentre)}
              ${modernRow("Approval Tier", emailData.approvalTier)}
              ${modernRow("Within Budget", emailData.withinBudget)}
             
            </table>
          </div>

          <div style="background: linear-gradient(145deg, #2c1a1a 0%, #1a0f0f 100%); border-radius: 20px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 1px solid rgba(163,29,29,0.2);">
            <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">Budget Summary</p>
            <table width="100%">
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Transport Cost</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.twoWayTransportCost}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Other Costs</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.otherCosts}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Per Diem Entitlement</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.perDiemPolicy}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                  <table width="100%">
                    <tr>
                      <td style="font-size: 14px; font-weight: 700; color: #f2d7d5;">Total Cost</td>
                      <td style="font-size: 20px; font-weight: 700; color: #ffffff; text-align: right;">KES ${emailData.estimatedCost}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>
          <div style="border-radius: 16px; border: 1px solid #f0e6e6; overflow: hidden;">
             ${statusCard("Head of Department", emailData.hodApprovalStatus, emailData.hodApprover, emailData.hodEmail, emailData.hodComments)}
             ${emailData.approvalTier === "Tier 2" || emailData.approvalTier === "Tier 3" ? statusCard("Human Resources", emailData.hrApprovalStatus, emailData.hrApprover, emailData.hrEmail, emailData.hrComments) : ""}
             ${emailData.approvalTier === "Tier 3" ? statusCard("Executive Director", emailData.directorApprovalStatus, emailData.directorApprover, emailData.directorEmail, emailData.directorComments, true) : ""}
          </div>

          <div style="margin-top: 32px; text-align: center;">
            <div style="${buttonStyle}">
              <a href="${reviewLink}" style="background: #a31d1d; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 15px rgba(163,29,29,0.3);">Review Requisition</a>
            </div>
            <div style="${pdfButtonStyle} width: 100%;">
              <a href="${PDF_WEB_APP_URL}/pdfdownload?requestId=${requestId}" style="color: #a31d1d; font-size: 12px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 12px;">Download PDF Summary</a>
            </div>
          </div>

        </div>

        <div style="background: #fdfafa; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #8c7474; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Travel Requisition</p>
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
      <td style="padding: 10px 0; font-size: 12px; color: #8c7474; width: 35%; border-bottom: 1px solid #f7f0f0;">${label}</td>
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
  let bg = "#fff3cd"; // Pending
  if (lower.includes("approved")) {
    color = "#155724";
    bg = "#d4edda";
  }
  if (lower.includes("declined")) {
    color = "#721c24";
    bg = "#f8d7da";
  }

  return `
    <div style="padding: 16px; border-bottom: ${isLast ? "none" : "1px solid #f0e6e6"}; background: #ffffff;">
      <table width="100%">
        <tr>
          <td>
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #8c7474; text-transform: uppercase;">${title}</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${name || "Awaiting Assignment"}</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${email || "Awaiting Assignment"}</p>
          </td>
          <td style="text-align: right;">
            <span style="padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background: ${bg}; text-transform: uppercase;">${status || "Pending"}</span>
          </td>
        </tr>
      </table>
      ${comments ? `<p style="margin: 8px 0 0; font-size: 12px; color: #6e5a5a; font-style: italic; background: #fdfdfd; padding: 8px; border-radius: 8px; border: 1px dashed #eee;">"${comments}"</p>` : ""}
    </div>
  `;
}
