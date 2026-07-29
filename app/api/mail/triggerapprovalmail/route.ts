import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { EmailSender } from "@/services/EmailSender";
import { ITEmailSender } from "@/services/ITEmailSender";
import { AccessEmailSender } from "@/services/AccessEmailSender";
import { AdvanceEmailSender } from "@/services/AdvanceEmailSender";

// An api to re-trigger a notification approval email for travel requisition
export async function POST(request: NextRequest) {
  const {
    secret,
    formType,
    to,
    requestId,
    message,
    title,
    role, //Optional value
    reviewLink, //Optional value
    showPdfDownload, //Optional Value
  } = await request.json();

  if (secret !== process.env.REVALIDATE_TAG_KEY) {
    return NextResponse.json(
      { message: "Invalid secret key" },
      { status: 401 },
    );
  }

  try {
    // Make sure the required data is available
    if (!formType || !to || !requestId || !message || !title) {
      return NextResponse.json(
        { message: "Missing some required fields" },
        { status: 400 },
      );
    }

    // Send the email based in form type (Firing and forgeting)
    switch (formType) {
      case "travel":
        EmailSender({
          to,
          requestId,
          reviewLink: reviewLink ? reviewLink : undefined,
          message,
          title,
          role: role ? role : "user",
          showPdfDownload: showPdfDownload ? showPdfDownload : undefined,
        });
        break;
      case "it":
        ITEmailSender({
          to,
          requestId,
          reviewLink: reviewLink ? reviewLink : undefined,
          message,
          title,
          role: role ? role : "user",
        });
        break;
      case "access":
        AccessEmailSender({
          to,
          requestId,
          reviewLink: reviewLink ? reviewLink : undefined,
          message,
          title,
          role: role ? role : "user",
          showPdfDownload: showPdfDownload ? showPdfDownload : undefined,
        });
        break;
      case "advance":
        AdvanceEmailSender({
          to,
          requestId,
          message,
          title,
        });
        break;
      default:
        return NextResponse.json(
          { message: "Unknown form type passed, try checking the spelling" },
          { status: 400 },
        );
    }

    return NextResponse.json(
      { message: "Email has been sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error while trying to send a triggered approval email:",
      error,
    );
    return NextResponse.json(
      { message: "Error while trying to send a triggered approval email" },
      { status: 500 },
    );
  }
}
