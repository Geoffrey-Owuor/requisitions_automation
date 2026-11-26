// The email-code sign-in's code email (serverActions/PublicServerActions/
// HubSignIn.ts). Styled like the salary advance verification email.
export function HubSignInCodeTemplate({
  code,
  expiryMinutes,
}: {
  code: string;
  expiryMinutes: number;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

        <!-- Header: solid background avoids Outlook gradient rendering issues -->
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Hotpoint Apps Hub</p>
          <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">Your sign-in code</h2>
        </div>

        <div style="margin: 24px 0;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
              Enter this code on the Apps Hub sign-in page to finish signing in. It expires in <strong>${expiryMinutes} minutes</strong> and works once.
            </p>
          </div>

          <div style="background-color: #0f172a; border-radius: 20px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 12px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px;">Sign-in Code</p>
            <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">${code}</p>
          </div>

          <div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; border: 1px solid #f2d7d5;">
            <p style="margin: 0; font-size: 12px; color: #a31d1d; line-height: 1.5;">
              Never share this code. If you didn't try to sign in, ignore this email - nobody can sign in without the code - and tell IT if it keeps happening.
            </p>
          </div>
        </div>

        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Apps Hub</p>
        </div>
      </div>
    </div>
  `;
}
