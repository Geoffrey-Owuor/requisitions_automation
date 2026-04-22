import nodemailer, { SendMailOptions } from "nodemailer";
import { Attachment } from "nodemailer/lib/mailer";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}`,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
  },
};

// 1. Define an interface for your function arguments
interface EmailOptions {
  to?: string | string[];
  cc?: string | string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
  }[];
}

const cca = new ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result?.accessToken;
}

export const sendEmail = async ({
  to,
  cc,
  subject,
  html,
  attachments,
}: EmailOptions) => {
  try {
    // 2. Use SendMailOptions for the config object
    const mailOptions: SendMailOptions = {
      from: `"Requisitions Automation" <${process.env.EMAIL_SENDER}>`,
      to,
      cc,
      subject,
      html,
    };

    if (attachments) {
      mailOptions.attachments = attachments.map(
        (attachment): Attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: "application/pdf",
        }),
      );
    }

    const accessToken = await getAccessToken();

    // Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false, //Use TLS
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_SENDER,
        accessToken: accessToken,
      },
    });

    //   Sending the email
    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    // 3. Handle 'error' as an Error object safely
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Email failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
