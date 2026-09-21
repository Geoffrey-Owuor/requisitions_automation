// Three templates for the salary advance "Request an email change" flow:
//  - requester copy: only what the requester typed (never on-file data)
//  - HR review: submission + on-file comparison + unverified warning (HR/admin only)
//  - on-file notice: tells the current mailbox owner a change was requested
// Every value here is unauthenticated user input, so it is HTML-escaped.

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface EmailChangeSubmission {
  staffNumber: string;
  staffName: string;
  department: string;
  reason: string;
  requestedEmail: string;
  submittedAt: string;
}

export interface EmailChangeOnFile {
  staffFound: boolean;
  staffName?: string;
  department?: string;
  email?: string;
}

function layout(heading: string, body: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">
        <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Human Resources</p>
          <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">${heading}</h2>
        </div>
        <div style="margin: 24px 0;">${body}</div>
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
          <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Hotpoint Appliances Ltd. | Salary Advance Requisition</p>
        </div>
      </div>
    </div>
  `;
}

function box(content: string) {
  return `<div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 20px; border: 1px solid #dbeafe;">${content}</div>`;
}

function warning(content: string) {
  return `<div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid #f2d7d5;"><p style="margin: 0; font-size: 13px; color: #a31d1d; line-height: 1.5;">${content}</p></div>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding: 6px 12px 6px 0; font-size: 12px; color: #64748b; vertical-align: top; white-space: nowrap;">${label}</td>
    <td style="padding: 6px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${value}</td>
  </tr>`;
}

function submissionRows(s: EmailChangeSubmission) {
  return [
    row("Staff Number", escapeHtml(s.staffNumber)),
    row("Staff Name", escapeHtml(s.staffName)),
    row("Department", escapeHtml(s.department)),
    row("Reason", escapeHtml(s.reason)),
    row("Requested Email", escapeHtml(s.requestedEmail)),
    row("Submitted", escapeHtml(s.submittedAt)),
  ].join("");
}

// Sent to the requester's new address only. Contains nothing from company_staff_data.
export function EmailChangeRequesterTemplate(s: EmailChangeSubmission) {
  return layout(
    "Email Change Request Received",
    `
    ${box(`<p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">Hello ${escapeHtml(s.staffName)}, we have received your request to change the email address on your staff record. HR will review it and may contact you to confirm your identity before any change is made.</p>`)}
    ${box(`<table>${submissionRows(s)}</table>`)}
    ${warning("If you did not make this request, please ignore this email and contact HR.")}
  `,
  );
}

// Sent to HR + admin only. The only email carrying on-file data.
export function EmailChangeHrTemplate(
  s: EmailChangeSubmission,
  onFile: EmailChangeOnFile,
) {
  const flag = (matches: boolean) =>
    matches
      ? `<span style="color: #15803d;">matches</span>`
      : `<span style="color: #b91c1c;">does not match</span>`;

  const same = (a: string | undefined, b: string) =>
    (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

  const comparison = onFile.staffFound
    ? `<table>
        ${row("Name on file", `${escapeHtml(onFile.staffName ?? "")} (${flag(same(onFile.staffName, s.staffName))})`)}
        ${row("Department on file", `${escapeHtml(onFile.department ?? "")} (${flag(same(onFile.department, s.department))})`)}
        ${row("Current email on file", escapeHtml(onFile.email ?? ""))}
      </table>`
    : `<p style="margin: 0; font-size: 14px; color: #b91c1c; font-weight: 600;">Staff number not found in the staff records.</p>`;

  return layout(
    "Email Change Request",
    `
    ${warning("<strong>Unverified request.</strong> The requester has not proven ownership of the new address or their identity. Confirm identity by phone or in person before changing anything. Do not reply to the requester from this message: replying would quote the on-file details below.")}
    <p style="margin: 0 0 8px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">Submitted by requester</p>
    ${box(`<table>${submissionRows(s)}</table>`)}
    <p style="margin: 0 0 8px; font-size: 10px; font-weight: 800; color: #a31d1d; text-transform: uppercase; letter-spacing: 2px;">On file (company staff records)</p>
    ${box(comparison)}
  `,
  );
}

// Courtesy notice to the mailbox currently on file, so the real owner can object.
export function EmailChangeOnFileNoticeTemplate(
  staffName: string,
  s: EmailChangeSubmission,
) {
  return layout(
    "Email Change Requested On Your Record",
    `
    ${box(`<p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">Hello ${escapeHtml(staffName)}, a request was submitted on the salary advance page to change the email address on your staff record to <strong>${escapeHtml(s.requestedEmail)}</strong> (submitted ${escapeHtml(s.submittedAt)}).</p>`)}
    ${warning("If this was you, no action is needed. If you did not make this request, please contact HR immediately so your record is not changed.")}
  `,
  );
}
