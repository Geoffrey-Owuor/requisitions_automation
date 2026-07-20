import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Workbook } from "exceljs";
import { getSession } from "@/lib/session";

export async function GET() {
  // Check if we have a valid session
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or no user found" },
      { status: 401 },
    );
  }

  // Our base query
  const baseQuery = `
  SELECT
  request_id, 
  TO_CHAR(request_created_at, 'YYYY-MM-DD HH24:MI:SS') AS request_created_at,
  submitter_email, submitter_name,
  employee_department, employee_staff_number, replacement_new,
  requirements, other_requirements, 
  TO_CHAR(requisition_date, 'YYYY-MM-DD HH24:MI:SS') AS requisition_date,
  TO_CHAR(date_joining, 'YYYY-MM-DD HH24:MI:SS') AS date_joining,
  hod_approver_name, hod_approver_email, hod_approver_status,
  hod_approver_comments, 
  TO_CHAR(hod_approval_date, 'YYYY-MM-DD HH24:MI:SS') AS hod_approval_date,
  it_approver_name, it_approver_email,
  it_approver_status, it_approver_comments, 
  TO_CHAR(it_approval_date, 'YYYY-MM-DD HH24:MI:SS') AS it_approval_date, 
  TO_CHAR(date_completed, 'YYYY-MM-DD HH24:MI:SS') AS date_completed, 
  completion_status
  FROM it_requisitions ORDER BY request_created_at DESC
  `;

  try {
    // Run the query
    const rows = await query(baseQuery);

    // Creating a workbook with exceljs and adding a new worksheet;
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("IT_Requsitions");

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

    // Generate a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="itrequisitions_data.xlsx"',
      },
    });
  } catch (error) {
    console.error("Failed to export IT requisitions data to excel:", error);
    return NextResponse.json(
      { message: "Failed to export issues data to excel" },
      { status: 500 },
    );
  }
}
