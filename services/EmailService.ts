// --- THE OLD SMTP NODEMAILER WAY --- (MANY SMTP Hurdles)
// import nodemailer, { SendMailOptions } from "nodemailer";
// import { Attachment } from "nodemailer/lib/mailer";
// import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

// const msalConfig: Configuration = {
//   auth: {
//     clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
//     authority: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}`,
//     clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
//   },
// };

// // 1. Define an interface for your function arguments
// interface EmailOptions {
//   to?: string | string[];
//   cc?: string | string;
//   subject: string;
//   html: string;
//   attachments?: {
//     filename: string;
//     content: string | Buffer;
//   }[];
// }

// const cca = new ConfidentialClientApplication(msalConfig);

// async function getAccessToken() {
//   const result = await cca.acquireTokenByClientCredential({
//     scopes: ["https://outlook.office365.com/.default"],
//   });
//   return result?.accessToken;
// }

// export const sendEmail = async ({
//   to,
//   cc,
//   subject,
//   html,
//   attachments,
// }: EmailOptions) => {
//   try {
//     // 2. Use SendMailOptions for the config object
//     const mailOptions: SendMailOptions = {
//       from: `"Requisitions Automation" <${process.env.EMAIL_SENDER}>`,
//       to,
//       cc,
//       subject,
//       html,
//     };

//     if (attachments) {
//       mailOptions.attachments = attachments.map(
//         (attachment): Attachment => ({
//           filename: attachment.filename,
//           content: attachment.content,
//           contentType: "application/pdf",
//         }),
//       );
//     }

//     const accessToken = await getAccessToken();

//     // Nodemailer Transporter
//     const transporter = nodemailer.createTransport({
//       host: "smtp.office365.com",
//       port: 587,
//       secure: false, //Use TLS
//       auth: {
//         type: "OAuth2",
//         user: process.env.EMAIL_SENDER,
//         accessToken: accessToken,
//       },
//     });

//     //   Sending the email
//     await transporter.sendMail(mailOptions);

//     return { success: true };
//   } catch (error) {
//     // 3. Handle 'error' as an Error object safely
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown error";
//     console.error("Email failed:", errorMessage);
//     return { success: false, error: errorMessage };
//   }
// };

// --- THE NEW WAY, DIRECTLY USING THE MICROSOFT GRAPH API---
import { sendGraphMail } from "./GraphMailClient";

interface EmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string | Buffer; // Expecting Base64 string or Buffer
  }[];
}

// Kill switch for every notification email - all mail goes through sendEmail.
// Only an explicit NOTIFICATION_EMAILS_ENABLED=false (any case) disables it;
// missing or any other value sends as normal.
const EMAILS_DISABLED_MESSAGE =
  "Notification emails are disabled (NOTIFICATION_EMAILS_ENABLED=false)";

let warnedAboutFlagValue = false;

function notificationEmailsEnabled(): boolean {
  const raw = process.env.NOTIFICATION_EMAILS_ENABLED;
  if (raw === undefined) return true;

  const value = raw.trim().toLowerCase();
  if (value === "false") return false;

  // Surface typos like "flase" or "0" instead of silently sending
  if (value !== "true" && !warnedAboutFlagValue) {
    warnedAboutFlagValue = true;
    console.warn(
      `NOTIFICATION_EMAILS_ENABLED has an unrecognised value "${raw}" - emails will be sent. Use "false" to disable them.`,
    );
  }
  return true;
}

export const sendEmail = async ({
  from,
  to,
  cc,
  replyTo,
  subject,
  html,
  attachments,
}: EmailOptions): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
}> => {
  // Reported as a failure (skipped: true) so callers that act on success -
  // e.g. the salary advance export only flags rows as exported once the
  // email goes out - never treat an unsent email as delivered. The body is
  // never logged: it carries approval-link tokens and verification codes.
  if (!notificationEmailsEnabled()) {
    console.info(
      `[email skipped] ${EMAILS_DISABLED_MESSAGE} - from: ${from}, to: ${[to].flat().join(", ")}${cc ? `, cc: ${[cc].flat().join(", ")}` : ""}, subject: "${subject}"`,
    );
    return { success: false, skipped: true, error: EMAILS_DISABLED_MESSAGE };
  }

  try {
    // Format recipients for Graph API
    const toRecipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      emailAddress: { address: email },
    }));

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc : [cc]).map((email) => ({
          emailAddress: { address: email },
        }))
      : [];

    const replyToRecipients = replyTo
      ? (Array.isArray(replyTo) ? replyTo : [replyTo]).map((email) => ({
          emailAddress: { address: email },
        }))
      : [];

    // Format attachments for Graph API
    const formattedAttachments = attachments?.map((file) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: file.filename,
      // Graph requires content to be a Base64 string
      contentBytes:
        typeof file.content === "string"
          ? file.content
          : file.content.toString("base64"),
    }));

    // Construct the Graph Message object
    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: html,
        },
        toRecipients: toRecipients,
        ccRecipients: ccRecipients,
        replyTo: replyToRecipients,
        attachments: formattedAttachments || [],
      },
      saveToSentItems: "true",
    };

    // Retries throttling, network failures and 5xx - see GraphMailClient.ts
    await sendGraphMail(from, emailPayload, subject);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Sender, recipients and subject (never the body) so a dropped email
    // can be identified and resent by hand.
    console.error(
      `Graph Email failed: from: ${from}, to: ${[to].flat().join(", ")}, subject: "${subject}": ${errorMessage}`,
    );
    return { success: false, error: errorMessage };
  }
};
