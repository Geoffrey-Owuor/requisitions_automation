import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Grab the data from the incoming request body
    const body = await request.json();
    const { accessToken, senderEmail, recipientEmail, subject, htmlContent } =
      body;

    // Basic validation
    if (!accessToken || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (accessToken, senderEmail, recipientEmail)",
        },
        { status: 400 },
      );
    }

    // 2. The Microsoft Graph API endpoint
    // Notice how we inject the senderEmail into the URL
    const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

    // 3. Construct the email payload strictly matching Microsoft's requirements
    const emailPayload = {
      message: {
        subject: subject || "Test Email from Next.js",
        body: {
          contentType: "HTML", // Can also be "Text"
          content: htmlContent || "<p>Hello from Microsoft Graph API!</p>",
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipientEmail,
            },
          },
        ],
      },
      saveToSentItems: "true", // Saves a copy in the sender's sent folder
    };

    // 4. Send the request to Microsoft Graph
    const response = await fetch(graphEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    // 5. Handle the Graph response
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Microsoft Graph Error:", errorData);
      return NextResponse.json(
        { error: "Graph API rejected the email", details: errorData },
        { status: response.status },
      );
    }

    // Graph API returns a 202 Accepted on success with no JSON body
    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
