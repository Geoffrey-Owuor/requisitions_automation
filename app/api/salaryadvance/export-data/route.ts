import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Workbook } from "exceljs";
import { getSession } from "@/lib/session";
import { addSheet } from "@/lib/excelExport";

// Explicit column lists (rather than deriving from the first row, like the
// cron export can) so both sheets always render with headers even when a
// date range or the "not yet exported" scope returns zero rows — an
// exceljs workbook with no worksheets fails to open in Excel.
const SALARY_ADVANCE_COLUMNS = [
  "request_created_at",
  "staff_number",
  "staff_name",
  "staff_email",
  "staff_department",
  "staff_location",
  "request_amount",
  "no_of_installments",
  "repayment_start_date",
  "request_type",
  "approval_status",
  "approver_comments",
  "exported",
  "altered",
];

const ALTERATION_COLUMNS = [
  "created_at",
  "staff_number",
  "staff_name",
  "staff_email",
  "alteration_type",
  "previous_request_type",
  "new_request_type",
  "previous_installments",
  "new_installments",
  "exported",
];

export async function GET(request: NextRequest) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ message: "Invalid user" }, { status: 401 });
  }
  // Get the search parameters
  const searchParams = request.nextUrl.searchParams;

  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  // "Everything not yet exported" reproduces the cron trigger's exact scope
  // on demand — same WHERE predicates, but read-only (see the comment below
  // the queries) — so HR can preview that report without waiting for the
  // scheduled run or touching the exported flags.
  const isUnexportedScope = searchParams.get("scope") === "unexported";

  if (!isUnexportedScope && (!fromDate || !toDate)) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  // altered = has an audit row in salary_advance_alterations — see
  // GetSalaryAdvanceData.ts for why this reads as "altered since export".
  const advanceQuery = isUnexportedScope
    ? `
      SELECT
      TO_CHAR(request_created_at, 'YYYY-MM-DD HH24:MI:SS') AS request_created_at,
      staff_number, staff_name, staff_email, staff_department,
      staff_location, request_amount, no_of_installments,
      TO_CHAR(repayment_start_date, 'YYYY-MM-DD HH24:MI:SS') AS repayment_start_date,
      request_type, approval_status, approver_comments, exported,
      EXISTS (SELECT 1 FROM salary_advance_alterations a WHERE a.request_id = sa.request_id) AS altered
      FROM salary_advances sa
      WHERE exported = false OR request_type = 'continuous'
      ORDER BY request_created_at DESC
    `
    : `
      SELECT
      TO_CHAR(request_created_at, 'YYYY-MM-DD HH24:MI:SS') AS request_created_at,
      staff_number, staff_name, staff_email, staff_department,
      staff_location, request_amount, no_of_installments,
      TO_CHAR(repayment_start_date, 'YYYY-MM-DD HH24:MI:SS') AS repayment_start_date,
      request_type, approval_status, approver_comments, exported,
      EXISTS (SELECT 1 FROM salary_advance_alterations a WHERE a.request_id = sa.request_id) AS altered
      FROM salary_advances sa
      WHERE request_created_at::date BETWEEN $1 AND $2
      ORDER BY request_created_at DESC
    `;

  // Alterations sheet is filtered by the alteration's own date (or, in the
  // unexported scope, its own exported flag) — not the parent request's
  // submit date — so it reflects "what alteration activity happened here",
  // even for requests submitted outside the range.
  const alterationQuery = isUnexportedScope
    ? `
      SELECT
      TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
      s.staff_number, s.staff_name, s.staff_email,
      a.alteration_type, a.previous_request_type, a.new_request_type,
      a.previous_installments, a.new_installments, a.exported
      FROM salary_advance_alterations a
      JOIN salary_advances s ON s.request_id = a.request_id
      WHERE a.exported = false
      ORDER BY a.created_at DESC
    `
    : `
      SELECT
      TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
      s.staff_number, s.staff_name, s.staff_email,
      a.alteration_type, a.previous_request_type, a.new_request_type,
      a.previous_installments, a.new_installments, a.exported
      FROM salary_advance_alterations a
      JOIN salary_advances s ON s.request_id = a.request_id
      WHERE a.created_at::date BETWEEN $1 AND $2
      ORDER BY a.created_at DESC
    `;

  const queryParams = isUnexportedScope ? [] : [fromDate, toDate];

  try {
    // Running the queries
    const [advanceRows, alterationRows] = await Promise.all([
      query(advanceQuery, queryParams),
      query(alterationQuery, queryParams),
    ]);

    // Creating a workbook with exceljs and adding the worksheets
    const workbook = new Workbook();
    addSheet(workbook, "Salary_Advances", advanceRows, SALARY_ADVANCE_COLUMNS);
    addSheet(workbook, "Alterations", alterationRows, ALTERATION_COLUMNS);

    // Generate a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // This is a read-only ad-hoc report — it must never flip `exported`.
    // Only the cron trigger (app/api/triggers/send-advance-requests) does
    // that, after a successful email send; flipping it here would silently
    // drop these rows from that scheduled export.
    const filenameSuffix = isUnexportedScope
      ? "Not_Yet_Exported"
      : `${fromDate}_to_${toDate}`;

    // send the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Salary_Advances_${filenameSuffix}.xlsx"`,
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
