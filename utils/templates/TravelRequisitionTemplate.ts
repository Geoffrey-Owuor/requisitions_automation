// --- OLD GMAIL GRADIENT THEMED EMAIL HTML TEMPLATE -----

// import { EmailDataValues } from "@/services/EmailSender";
// import { dateFormatter } from "@/public/assets";
// import { EmailDataProps } from "@/services/EmailSender";

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// interface TravelRequisitionProps extends Omit<EmailDataProps, "to"> {
//   emailData: EmailDataValues;
// }

// export function TravelRequisitionTemplate({
//   requestId,
//   message,
//   title,
//   role,
//   emailData,
//   reviewLink,
//   showPdfDownload,
// }: TravelRequisitionProps) {
//   const formattedDepartureDate = dateFormatter(emailData.departuredate);
//   const formattedReturnDate = dateFormatter(emailData.returndate);

//   const buttonStyle =
//     role !== "user" ? "display: inline-block;" : "display: none;";
//   const pdfButtonStyle = showPdfDownload
//     ? "display: inline-block; margin-top: 10px;"
//     : "display: none;";

//   // The major template
//   const emailHtml = `
//     <div style="background-color: #fcfafb; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
//       <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(163,29,29,0.08); border: 1px solid #f2eaea;">

//         <div style="background: linear-gradient(135deg, #a31d1d 0%, #7a1515 100%); padding: 24px 30px; border-bottom: 4px solid #f2d7d5;">
//            <table width="100%">
//              <tr>
//                <td style="vertical-align: middle;">
//                  <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.8;">New Requisition</p>
//                  <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${title}</h2>
//                </td>

//              </tr>
//            </table>
//         </div>

//         <div style="padding: 30px 24px;">

//           <div style="background-color: #fdf6f6; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #f9e8e8;">
//             <p style="margin: 0; font-size: 15px; color: #4a3a3a; line-height: 1.6;">${message}</p>
//           </div>

//           <div style="margin-bottom: 24px;">
//             <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Primary Information</p>
//             <table width="100%" style="border-collapse: collapse;">
//               ${modernRow("Employee", emailData.employeename)}
//               ${modernRow("Email", emailData.emailaddress)}
//               ${modernRow("Department", emailData.department)}
//               ${modernRow("Designation", emailData.designation)}
//               ${modernRow("Destination", emailData.destination)}
//               ${modernRow("Travel Category", emailData.travelcategory)}
//               ${modernRow("Travel Dates", `${formattedDepartureDate} - ${formattedReturnDate}`)}
//               ${modernRow("Transport Mode", emailData.modeoftransport)}
//               ${modernRow("Business Justification", emailData.businessjustification)}
//               ${modernRow("Cost Centre", emailData.costcentre)}
//               ${modernRow("Approval Tier", emailData.approvaltier)}
//               ${modernRow("Within Budget", emailData.withinbudget)}

//             </table>
//           </div>

//           <div style="background: linear-gradient(145deg, #2c1a1a 0%, #1a0f0f 100%); border-radius: 20px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 1px solid rgba(163,29,29,0.2);">
//             <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">Budget Summary</p>
//             <table width="100%">
//               <tr>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Transport Cost</td>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.twowaytransportcost}</td>
//               </tr>
//               <tr>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Other Costs</td>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.othercosts}</td>
//               </tr>
//               <tr>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #8c7474;">Per Diem Entitlement</td>
//                 <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.perdiempolicy}</td>
//               </tr>
//               <tr>
//                 <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
//                   <table width="100%">
//                     <tr>
//                       <td style="font-size: 14px; font-weight: 700; color: #f2d7d5;">Total Cost</td>
//                       <td style="font-size: 20px; font-weight: 700; color: #ffffff; text-align: right;">KES ${emailData.estimatedcost}</td>
//                     </tr>
//                   </table>
//                 </td>
//               </tr>
//             </table>
//           </div>

//           <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>
//           <div style="border-radius: 16px; border: 1px solid #f0e6e6; overflow: hidden;">
//              ${statusCard("Head of Department", emailData.hodapprovalstatus, emailData.hodapprover, emailData.hodemail, emailData.hodcomments)}
//              ${emailData.approvaltier === "Tier 2" || emailData.approvaltier === "Tier 3" ? statusCard("Human Resources", emailData.hrapprovalstatus, emailData.hrapprover, emailData.hremail, emailData.hrcomments) : ""}
//              ${emailData.approvaltier === "Tier 3" ? statusCard("Executive Director", emailData.directorapprovalstatus, emailData.directorapprover, emailData.directoremail, emailData.directorcomments, true) : ""}
//           </div>

//           <div style="margin-top: 32px; text-align: center;">
//             <div style="${buttonStyle}">
//               <a href="${BASE_URL}/travelapproval/${requestId}${reviewLink}" style="background: #a31d1d; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 15px rgba(163,29,29,0.3);">Review Requisition</a>
//             </div>
//             <div style="${pdfButtonStyle} width: 100%;">
//               <a href="${BASE_URL}/pdfdownload?requestId=${requestId}" style="color: #a31d1d; font-size: 12px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 12px;">Download PDF Summary</a>
//             </div>
//           </div>

//         </div>

//         <div style="background: #fdfafa; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
//           <p style="margin: 0; font-size: 10px; color: #8c7474; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Travel Requisition</p>
//         </div>
//       </div>
//     </div>
//   `;

//   return emailHtml;
// }

// /** * HELPER: MODERN CLEAN ROW
//  */
// function modernRow(label: string, value: string) {
//   return `
//     <tr>
//       <td style="padding: 10px 0; font-size: 12px; color: #8c7474; width: 35%; border-bottom: 1px solid #f7f0f0;">${label}</td>
//       <td style="padding: 10px 0; font-size: 13px; color: #1a0f0f; font-weight: 500; border-bottom: 1px solid #f7f0f0;">${value || "—"}</td>
//     </tr>`;
// }

// /**
//  * HELPER: STATUS CARD (INTEGRATED)
//  */
// function statusCard(
//   title: string,
//   status: string,
//   name: string,
//   email: string,
//   comments: string,
//   isLast = false,
// ) {
//   const lower = (status || "").toLowerCase();
//   let color = "#856404";
//   let bg = "#fff3cd"; // Pending
//   if (lower.includes("approved")) {
//     color = "#155724";
//     bg = "#d4edda";
//   }
//   if (lower.includes("declined")) {
//     color = "#721c24";
//     bg = "#f8d7da";
//   }

//   return `
//     <div style="padding: 16px; border-bottom: ${isLast ? "none" : "1px solid #f0e6e6"}; background: #ffffff;">
//       <table width="100%">
//         <tr>
//           <td>
//             <p style="margin: 0; font-size: 10px; font-weight: 800; color: #8c7474; text-transform: uppercase;">${title}</p>
//             <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${name || "Awaiting Assignment"}</p>
//             <p style="margin: 2px 0 0; font-size: 13px; color: #1a0f0f; font-weight: 600;">${email || "Awaiting Assignment"}</p>
//           </td>
//           <td style="text-align: right;">
//             <span style="padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background: ${bg}; text-transform: uppercase;">${status || "Pending"}</span>
//           </td>
//         </tr>
//       </table>
//       ${comments ? `<p style="margin: 8px 0 0; font-size: 12px; color: #6e5a5a; font-style: italic; background: #fdfdfd; padding: 8px; border-radius: 8px; border: 1px dashed #eee;">"${comments}"</p>` : ""}
//     </div>
//   `;
// }

import { EmailDataValues } from "@/services/EmailSender";
import { dateFormatter } from "@/public/assets";
import { EmailDataProps } from "@/services/EmailSender";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface TravelRequisitionProps extends Omit<EmailDataProps, "to"> {
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
  const formattedDepartureDate = dateFormatter(emailData.departuredate);
  const formattedReturnDate = dateFormatter(emailData.returndate);

  const buttonStyle =
    role !== "user" ? "display: inline-block;" : "display: none;";
  const pdfButtonStyle = showPdfDownload
    ? "display: inline-block; margin-top: 10px;"
    : "display: none;";

  // The major template
  const emailHtml = `
    <div style="background-color: #fcfafb; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(163,29,29,0.08); border: 1px solid #f2eaea;">
        
        <!-- ✅ CHANGED: Replaced linear-gradient with solid background-color.
             Outlook ignores CSS gradients and renders a transparent/white background,
             which made the white title text invisible in Outlook light mode. -->
        <div style="background-color: #a31d1d; padding: 24px 30px; border-bottom: 4px solid #f2d7d5;">
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
          
          <!-- ✅ CHANGED: background-color from #fdf6f6 to #ffffff.
               Near-white backgrounds like #fdf6f6 can be left un-inverted by Outlook dark mode,
               while text gets darkened — making content invisible. Pure white is handled more
               predictably across all Outlook rendering modes. -->
          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #f9e8e8;">
            <p style="margin: 0; font-size: 15px; color: #4a3a3a; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Primary Information</p>
            <table width="100%" style="border-collapse: collapse;">
              ${modernRow("Employee", emailData.employeename)}
              ${modernRow("Email", emailData.emailaddress)}
              ${modernRow("Department", emailData.department)}
              ${modernRow("Designation", emailData.designation)}
              ${modernRow("Destination", emailData.destination)}
              ${modernRow("Travel Category", emailData.travelcategory)}
              ${modernRow("Travel Dates", `${formattedDepartureDate} - ${formattedReturnDate}`)}
              ${modernRow("Transport Mode", emailData.modeoftransport)}
              ${modernRow("Business Justification", emailData.businessjustification)}
              ${modernRow("Cost Centre", emailData.costcentre)}
              ${modernRow("Approval Tier", emailData.approvaltier)}
              ${modernRow("Within Budget", emailData.withinbudget)}
            </table>
          </div>

          <!-- ✅ CHANGED: Replaced linear-gradient with solid background-color: #2c1a1a.
               This is the most critical fix. Outlook ignores CSS gradients entirely and
               renders the background as transparent/white, making ALL white and light-coloured
               text inside (totals, labels, amounts) completely invisible in light mode.
               A solid dark colour is reliably rendered by Outlook. -->
          <div style="background-color: #2c1a1a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(163,29,29,0.2);">
            <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">Budget Summary</p>
            <table width="100%">
              <tr>
                <!-- ✅ CHANGED: Label colour from #8c7474 to #c9a8a8.
                     #8c7474 on a dark background can disappear in Outlook dark mode
                     when Outlook adjusts contrast unpredictably. A lighter tint of the
                     brand colour ensures legibility on the dark background in all modes. -->
                <td style="padding-bottom: 12px; font-size: 12px; color: #c9a8a8;">Transport Cost</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.twowaytransportcost}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #c9a8a8;">Other Costs</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.othercosts}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; font-size: 12px; color: #c9a8a8;">Per Diem Entitlement</td>
                <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">KES ${emailData.perdiempolicy}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                  <table width="100%">
                    <tr>
                      <td style="font-size: 14px; font-weight: 700; color: #f2d7d5;">Total Cost</td>
                      <td style="font-size: 20px; font-weight: 700; color: #ffffff; text-align: right;">KES ${emailData.estimatedcost}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; font-weight: 700; color: #a31d1d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Approval Workflow</p>
          <div style="border-radius: 16px; border: 1px solid #f0e6e6; overflow: hidden;">
             ${statusCard("Head of Department", emailData.hodapprovalstatus, emailData.hodapprover, emailData.hodemail, emailData.hodcomments)}
             ${emailData.approvaltier === "Tier 2" || emailData.approvaltier === "Tier 3" ? statusCard("Human Resources", emailData.hrapprovalstatus, emailData.hrapprover, emailData.hremail, emailData.hrcomments) : ""}
             ${emailData.approvaltier === "Tier 3" ? statusCard("Executive Director", emailData.directorapprovalstatus, emailData.directorapprover, emailData.directoremail, emailData.directorcomments, true) : ""}
          </div>

          <div style="margin-top: 32px; text-align: center;">
            <div style="${buttonStyle}">
              <a href="${BASE_URL}/travelapproval/${requestId}${reviewLink}" style="background-color: #a31d1d; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">Review Requisition</a>
            </div>
            <div style="${pdfButtonStyle} width: 100%;">
              <a href="${BASE_URL}/pdfdownload?requestId=${requestId}" style="color: #a31d1d; font-size: 12px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 12px;">Download PDF Summary</a>
            </div>
          </div>

        </div>

        <!-- ✅ CHANGED: background-color from #fdfafa to #ffffff.
             Same reason as the message box above — near-white backgrounds
             behave unpredictably in Outlook dark mode. -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
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
  // ✅ CHANGED: Label colour from #8c7474 to #5a3a3a.
  // #8c7474 is a muted mid-tone that sits in a danger zone — Outlook dark mode
  // may darken the white row background without adjusting this text colour,
  // making labels disappear. A darker shade ensures contrast on both light
  // and dark-adjusted backgrounds.
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

  // ✅ CHANGED: All three badge states now include a matching solid border.
  // Outlook dark mode can invert badge background colours while leaving text
  // colour unchanged (or vice versa), killing contrast. A border in the same
  // colour as the text acts as a visible fallback outline so the badge always
  // reads correctly regardless of how Outlook handles the fill.
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

  // ✅ CHANGED: Status card background from #ffffff to #ffffff (explicit).
  // Also changed label/sub-text colour from #8c7474 to #5a3a3a for the same
  // reason as modernRow — better contrast resilience in Outlook dark mode.
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
            <!-- ✅ CHANGED: Added border: ${border} to badge span (see variable above).
                 border is now dynamically matched to the text colour per status state. -->
            <span style="padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${color}; background-color: ${bg}; border: ${border}; text-transform: uppercase;">${status || "Pending"}</span>
          </td>
        </tr>
      </table>
      ${comments ? `<p style="margin: 8px 0 0; font-size: 12px; color: #5a3a3a; font-style: italic; background-color: #ffffff; padding: 8px; border-radius: 8px; border: 1px dashed #eee;">"${comments}"</p>` : ""}
    </div>
  `;
}
