import { NextResponse, NextRequest } from "next/server";
import { Workbook } from "exceljs";
import { query } from "@/lib/db";
import { sendEmail } from "@/services/EmailService";

export async function GET(request: NextRequest) {
  // Get current date
  const date = new Date().toLocaleString();
  const dateString = new Date().toISOString().split("T")[0]; // For a clean filename

  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { message: "Invalid secret key" },
      { status: 401 },
    );
  }

  // The base fetch query
  const baseQuery = `
    SELECT 
    TO_CHAR(request_created_at, 'YYYY-MM-DD HH24:MI:SS') AS request_created_at,
    staff_number, staff_name, staff_email, staff_department, 
    staff_location, request_amount, no_of_installments,
    TO_CHAR(repayment_start_date, 'YYYY-MM-DD HH24:MI:SS') AS repayment_start_date, 
    request_type, approval_status, approver_comments
    FROM salary_advances
    WHERE DATE_TRUNC('month', request_created_at) = DATE_TRUNC('month', CURRENT_DATE)
    OR request_type = 'continuous'
    ORDER BY request_created_at ASC
    `;

  try {
    // Run the query
    const rows = await query(baseQuery);

    // If the returned data length is zero - no advance submissions were made for the current month
    // Only return a success message
    if (rows.length === 0) {
      return NextResponse.json(
        {
          message: `0 rows returned, no salary advances data for date:${date}`,
        },
        { status: 200 },
      );
    }

    // Creating a workbook with exceljs and adding a new worksheet;
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Salary_Advances");

    // Defining the columns for our worksheet
    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map((key) => ({
        // Split by an underscore, capitalize first letter of each word and join with a space
        header: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        key: key,
        width: 20,
        numFmt: ["ated_at", "date"].some((str) => key.includes(str))
          ? "yyyy-mm-dd hh:mm:ss"
          : undefined,
      }));

      // Make the entire header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add the data rows
      worksheet.addRows(rows);
    }

    // Generate a buffer from the workbook
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // The html template code
    const currentYear = new Date().getFullYear();
    const recordCount = rows.length;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; border-radius: 24px; margin: 0 auto; background: transparent; overflow: hidden;">

          <!-- Header: solid background avoids Outlook gradient rendering issues -->
          <div style="background-color: #a31d1d; padding: 18px 20px; border-bottom: 4px solid #f2d7d5;">
            <table width="100%">
              <tr>
                <td style="vertical-align: middle;">
                  <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f2d7d5; opacity: 0.85;">Human Resources</p>
                  <h2 style="margin: 4px 0 0; font-size: 20px; color: #ffffff; font-weight: 600;">Salary Advance Export</h2>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <div style="display: inline-block; background-color: #7f1d1d; border-radius: 12px; padding: 8px 14px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f2d7d5; letter-spacing: 1px;">REPORT</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin: 24px 0;">

            <!-- Message box -->
            <div style="background-color: #ffffff; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #dbeafe;">
              <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
                The automated monthly Salary Advance data export has completed successfully. Please find the compiled Excel spreadsheet attached to this email.
              </p>
            </div>

            <!-- Submission meta strip -->
            <div style="background-color: #fdf2f2; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid #f2d7d5;">
              <table width="100%">
                <tr>
                  <td style="font-size: 11px; color: #a31d1d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Export Source</td>
                  <td style="font-size: 11px; color: #a31d1d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Generated On</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px;">Automated Cron System</td>
                  <td style="font-size: 14px; color: #3b0a0a; font-weight: 600; padding-top: 2px; text-align: right;">${date}</td>
                </tr>
              </table>
            </div>

            <!-- Export Summary Details: dark solid box -->
            <div style="background-color: #0f172a; border-radius: 20px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(30,58,138,0.3);">
              <p style="margin: 0 0 16px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px;">Export Details</p>
              <table width="100%">
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Data Scope</td>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">Current Month &amp; Continuous</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #94a3b8;">Total Records Included</td>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">${recordCount} rows</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 0; font-size: 12px; color: #94a3b8;">Attachment Format</td>
                  <td style="padding-bottom: 0; font-size: 12px; color: #ffffff; text-align: right; font-weight: 600;">Excel Spreadsheet (.xlsx)</td>
                </tr>
              </table>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #f2eaea;">
            <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">&copy; ${currentYear} Hotpoint Appliances Ltd. | Salary Advance Requisition System</p>
          </div>

        </div>
      </div>
`;

    // Send the email with the generated buffer as an attachment
    const emailResult = await sendEmail({
      from: process.env.ADVANCE_EMAIL_SENDER!,
      to: [process.env.FIRST_HR_EMAIL!, process.env.SECOND_HR_EMAIL!],
      subject: `Monthly Salary Advances Report - ${dateString}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Salary_Advances_${dateString}.xlsx`,
          content: buffer,
        },
      ],
    });

    // Check if the email was successfully sent
    if (!emailResult.success) {
      throw new Error(emailResult.error || "Unknown email sending error");
    }

    // Return a success response
    return NextResponse.json(
      {
        message: `Salary advance data for date: ${date} exported and emailed successfully, Rows: ${rows.length}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `Failed to export and email salary advance requisitions data for the date: ${date}`,
      error,
    );
    return NextResponse.json(
      {
        message: "Failed to export and email data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
