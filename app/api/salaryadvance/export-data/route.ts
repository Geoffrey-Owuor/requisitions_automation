import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Workbook } from "exceljs";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ message: "Invalid user" }, { status: 401 });
  }
  // Get the search parameters
  const searchParams = request.nextUrl.searchParams;

  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  if (!fromDate || !toDate) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const baseQuery = `
   SELECT 
    TO_CHAR(request_created_at, 'YYYY-MM-DD HH24:MI:SS') AS request_created_at,
    staff_number, staff_name, staff_email, staff_department, 
    staff_location, request_amount, no_of_installments,
    TO_CHAR(repayment_start_date, 'YYYY-MM-DD HH24:MI:SS') AS repayment_start_date, 
    request_type, approval_status, approver_comments
    FROM salary_advances
    WHERE request_created_at::date BETWEEN $1 AND $2
    ORDER BY request_created_at DESC
  `;

  try {
    //Running the query
    const rows = await query(baseQuery, [fromDate, toDate]);

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

    // Generate a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // send the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="issues_data.xlsx"',
      },
    });
  } catch (error) {
    console.error(
      "Error while trying to get the salary advance export data:",
      error,
    );
    return NextResponse.json(
      { message: "Error while trying to get the salary advance export data" },
      { status: 500 },
    );
  }
}
