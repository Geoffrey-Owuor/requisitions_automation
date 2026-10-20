// Sent instead of a verification code when the email belongs to a staff
// record HR has deactivated (migration 032), so the person learns why no
// code arrives. It goes only to the email on file, never to a typed one.
export function AdvanceRecordInactiveTemplate({
  staffName,
}: {
  staffName: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <!-- Header: solid background avoids Outlook gradient rendering issues -->
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Human Resources</p>
          <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">Your staff record is inactive</h2>
        </div>

        <div style="margin: 24px 0;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #dbeafe;">
            <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
              Hello ${staffName || "there"}, someone asked for a salary advance verification code for this email address. We didn't send one, because the staff record linked to it is currently inactive.
            </p>
            <p style="margin: 12px 0 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
              If you think this is a mistake, please contact HR.
            </p>
          </div>

          <div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; border: 1px solid #f2d7d5;">
            <p style="margin: 0; font-size: 12px; color: #a31d1d; line-height: 1.5;">
              If you didn't ask for a code, you can safely ignore this email.
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
}
