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
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}`,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
  },
};

interface EmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string | Buffer; // Expecting Base64 string or Buffer
  }[];
}

const cca = new ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const result = await cca.acquireTokenByClientCredential({
    // Using Graph scope now
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result?.accessToken;
}

export const sendEmail = async ({
  from,
  to,
  cc,
  subject,
  html,
  attachments,
}: EmailOptions) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to retrieve access token");

    // Format recipients for Graph API
    const toRecipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      emailAddress: { address: email },
    }));

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc : [cc]).map((email) => ({
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
        attachments: formattedAttachments || [],
      },
      saveToSentItems: "true",
    };

    // Send via Fetch to Microsoft Graph
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${from}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to send email via Graph",
      );
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Graph Email failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
