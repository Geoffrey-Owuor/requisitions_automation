interface AdvanceVerificationCodeProps {
  staffName: string;
  code: string;
}

export function AdvanceVerificationCodeTemplate({
  staffName,
  code,
}: AdvanceVerificationCodeProps) {
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <!-- Header: solid background avoids Outlook gradient rendering issues -->
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <table width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Human Resources</p>
                <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">Salary Advance Verification Code</h2>
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
            <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
              Hello ${staffName || "there"}, use the code below to verify your identity and continue your salary advance request. This code expires in <strong>10 minutes</strong>.
            </p>
          </div>

          <!-- Code box -->
          <div style="background-color: #0f172a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(30,58,138,0.3); text-align: center;">
            <p style="margin: 0 0 12px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">${code}</p>
          </div>

          <div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; border: 1px solid #f2d7d5;">
            <p style="margin: 0; font-size: 12px; color: #a31d1d; line-height: 1.5;">
              If you did not request this code, you can safely ignore this email, or contact HR if you have concerns.
            </p>
          </div>

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
