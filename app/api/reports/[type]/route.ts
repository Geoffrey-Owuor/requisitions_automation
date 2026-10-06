import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  REPORT_STATUS_FILTERS,
  canDownloadReport,
  getReport,
  getReportRangeError,
  isReportStatusFilter,
  isReportType,
} from "@/lib/reports/definitions";
import { REPORT_BUILDERS } from "@/lib/reports/builders";
import { buildReportWorkbook } from "@/lib/reports/workbook";

// Downloads one report as an Excel workbook:
//   GET /api/reports/{type}?from=YYYY-MM-DD&to=YYYY-MM-DD&status=all
// Dates are inclusive Africa/Nairobi calendar days on the submission date.
// The Reports page only offers what the viewer may download; this route
// re-checks the report's role on every request, and logs each successful
// download to report_downloads.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { type } = await params;
  if (!isReportType(type)) {
    return NextResponse.json({ message: "Unknown report" }, { status: 404 });
  }

  const roles = await getUserRoles(session.email);
  if (!canDownloadReport(roles, type)) {
    return NextResponse.json(
      { message: "You are not authorized to download this report" },
      { status: 403 },
    );
  }

  const search = request.nextUrl.searchParams;
  const from = search.get("from") ?? "";
  const to = search.get("to") ?? "";
  const status = search.get("status") ?? "all";

  const rangeError = getReportRangeError(from, to);
  if (rangeError) {
    return NextResponse.json({ message: rangeError }, { status: 400 });
  }
  if (!isReportStatusFilter(status)) {
    return NextResponse.json(
      { message: "Unknown status filter" },
      { status: 400 },
    );
  }

  const report = getReport(type);

  try {
    const sheets = await REPORT_BUILDERS[type]({ from, to, status });
    const buffer = await buildReportWorkbook(sheets, {
      title: report.label,
      rowUnit: report.rowUnit,
      from,
      to,
      statusLabel: REPORT_STATUS_FILTERS.find((f) => f.value === status)!
        .label,
      generatedBy: `${session.name} (${session.email})`,
    });

    // The audit log is part of the download: no log row, no file
    await query(
      `INSERT INTO report_downloads
         (report_type, downloaded_by_email, downloaded_by_name,
          from_date, to_date, status_filter, row_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        type,
        session.email,
        session.name,
        from,
        to,
        status,
        sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
      ],
    );

    const filename = `${report.label.replace(/[^A-Za-z0-9]+/g, "_")}_${from}_to_${to}.xlsx`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`Error while generating the ${type} report:`, error);
    return NextResponse.json(
      { message: "Something went wrong while generating the report" },
      { status: 500 },
    );
  }
}
