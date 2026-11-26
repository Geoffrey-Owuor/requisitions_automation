// The Staff directory's Excel export, for hr-advance holders only:
//   GET - every staff record as an .xlsx, deactivated ones included
// Each download is logged to report_downloads in the same request (no log
// row, no file), since the file is a full copy of the staff's personal data.
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getHrAdvanceSession } from "@/lib/salaryAdvanceAccess";
import {
  STAFF_EXPORT_REPORT_TYPE,
  buildStaffDirectoryExport,
} from "@/lib/staffExport";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const actor = await getHrAdvanceSession();
  if (!actor) {
    return NextResponse.json(
      { message: "You are not authorized to export staff records" },
      { status: 403, headers: noStore },
    );
  }

  try {
    const { buffer, rowCount, today } = await buildStaffDirectoryExport(actor);

    await query(
      `INSERT INTO report_downloads
         (report_type, downloaded_by_email, downloaded_by_name,
          from_date, to_date, status_filter, row_count)
       VALUES ($1, $2, $3, $4, $4, 'all', $5)`,
      [STAFF_EXPORT_REPORT_TYPE, actor.email, actor.name, today, rowCount],
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        ...noStore,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Staff_Directory_${today}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error while exporting the staff directory:", error);
    return NextResponse.json(
      {
        message: "The staff directory could not be exported, please try again",
      },
      { status: 500, headers: noStore },
    );
  }
}
