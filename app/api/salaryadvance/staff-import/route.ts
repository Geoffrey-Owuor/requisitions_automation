// The Staff directory's Excel import, for hr-advance holders only:
//   GET  - the import template (.xlsx), its department list from the
//          active base_departments
//   POST - multipart { file, mode: "check" | "import" }. "check" returns the
//          per-row preview; "import" re-reads the file and re-checks it under
//          the staff directory lock, then adds every new row in one
//          transaction, or none (409 with the fresh check) if any row fails.
// A route rather than a server action: uploads exceed the server action
// body limit, and the template is a download.
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getHrAdvanceSession } from "@/lib/salaryAdvanceAccess";
import { lockStaffDirectory } from "@/lib/staffDirectory";
import {
  STAFF_IMPORT_MAX_BYTES,
  type StaffImportResponse,
} from "@/lib/staffImport";
import {
  buildStaffImportTemplate,
  checkStaffRows,
  insertStaffRows,
  readStaffWorkbook,
} from "@/lib/staffImportWorkbook";

const noStore = { "Cache-Control": "no-store" };

const respond = (body: StaffImportResponse, status = 200) =>
  NextResponse.json(body, { status, headers: noStore });

const forbidden = () =>
  respond({ message: "You are not authorized to import staff records" }, 403);

export async function GET() {
  if (!(await getHrAdvanceSession())) return forbidden();
  try {
    const client = await pool.connect();
    try {
      const file = await buildStaffImportTemplate(client);
      return new NextResponse(new Uint8Array(file), {
        headers: {
          ...noStore,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition":
            'attachment; filename="Staff_Import_Template.xlsx"',
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error while building the staff import template:", error);
    return respond(
      { message: "The template could not be created, please try again" },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const actor = await getHrAdvanceSession();
  if (!actor) return forbidden();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respond({ message: "Choose a file to upload" }, 400);
  }
  const file = formData.get("file");
  const mode = formData.get("mode");
  if (!(file instanceof File) || file.size === 0) {
    return respond({ message: "Choose a file to upload" }, 400);
  }
  if (mode !== "check" && mode !== "import") {
    return respond({ message: "Unknown import step" }, 400);
  }
  if (file.size > STAFF_IMPORT_MAX_BYTES) {
    return respond({ message: "The file is larger than 2MB" }, 400);
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return respond(
      {
        message:
          "Upload an Excel workbook (.xlsx) - save the file as .xlsx first",
      },
      400,
    );
  }

  const { rows, fileErrors } = await readStaffWorkbook(
    await file.arrayBuffer(),
  );
  const emptyCheck = {
    fileErrors,
    rows: [],
    counts: { new: 0, existing: 0, error: 0 },
  };

  const client = await pool.connect();
  try {
    if (mode === "check") {
      const check =
        fileErrors.length > 0 ? emptyCheck : await checkStaffRows(client, rows);
      return respond({ mode: "check", check });
    }

    if (fileErrors.length > 0) {
      return respond(
        { mode: "refused", check: emptyCheck, message: fileErrors[0] },
        409,
      );
    }
    await client.query("BEGIN");
    await lockStaffDirectory(client);
    const check = await checkStaffRows(client, rows);
    if (check.counts.error > 0) {
      await client.query("ROLLBACK");
      return respond(
        {
          mode: "refused",
          check,
          message:
            "Nothing was imported - some rows no longer pass. Review them and upload again.",
        },
        409,
      );
    }
    const imported = await insertStaffRows(
      client,
      actor,
      check,
      file.name.slice(0, 200),
    );
    await client.query("COMMIT");

    const skipped = check.counts.existing;
    const message =
      imported === 0
        ? "Nothing to import - every row is already on file"
        : `Imported ${imported} staff record${imported === 1 ? "" : "s"}${
            skipped ? `, skipped ${skipped} already on file` : ""
          }. Add them in the HR system too.`;
    return respond({ mode: "import", imported, skipped, message });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      `Error while ${mode === "check" ? "checking" : "importing"} staff records:`,
      error,
    );
    return respond(
      {
        message:
          mode === "check"
            ? "The file could not be checked, please try again"
            : "Nothing was imported, please try again",
      },
      500,
    );
  } finally {
    client.release();
  }
}
