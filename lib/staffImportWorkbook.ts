import "server-only";
import type { PoolClient } from "pg";
import ExcelJS from "exceljs";
import { ConfigInputError, cleanConfigEmail } from "@/lib/configAdminAccess";
import type { SessionPayload } from "@/lib/session";
import {
  STAFF_EMAIL_KEY_SQL,
  STAFF_FIELD_LIMITS,
  STAFF_NUMBER_KEY_SQL,
  staffNumberKey,
} from "@/lib/staffDirectory";
import {
  STAFF_IMPORT_MAX_ROWS,
  type StaffImportCheck,
  type StaffImportRow,
} from "@/lib/staffImport";

// The Staff directory's Excel import: the template HR downloads, reading an
// uploaded workbook, checking its rows against company_staff_data and adding
// them. Uniqueness follows lib/staffDirectory.ts (also enforced by migration
// 038's unique indexes), and departments must be active base_departments.

type Field = "staffNumber" | "name" | "email" | "department" | "location";

const COLUMNS: {
  field: Field;
  header: string;
  width: number;
  aliases: string[];
}[] = [
  {
    field: "staffNumber",
    header: "Staff Number",
    width: 16,
    aliases: ["staff no", "staff no.", "staff_number", "staff number"],
  },
  {
    field: "name",
    header: "Name",
    width: 32,
    aliases: ["name", "staff name", "full name"],
  },
  {
    field: "email",
    header: "Email",
    width: 34,
    aliases: ["email", "staff email", "email address"],
  },
  {
    field: "department",
    header: "Department",
    width: 28,
    aliases: ["department", "staff department"],
  },
  {
    field: "location",
    header: "Location",
    width: 24,
    aliases: ["location", "staff location"],
  },
];

const LABELS: Record<Field, string> = {
  staffNumber: "staff number",
  name: "name",
  email: "email",
  department: "department",
  location: "location",
};

const STAFF_SHEET = "Staff";
const DEPARTMENTS_SHEET = "Departments";

async function loadActiveDepartments(
  client: Pick<PoolClient, "query">,
): Promise<string[]> {
  const { rows } = await client.query<{ name: string }>(
    `SELECT department_name AS name FROM base_departments
     WHERE is_active ORDER BY 1`,
  );
  return rows.map((row) => row.name);
}

// The template: the Staff sheet (staff numbers as text, so Excel keeps
// leading zeros; a department dropdown), the list behind that dropdown on a
// hidden sheet, and instructions
export async function buildStaffImportTemplate(
  client: Pick<PoolClient, "query">,
): Promise<Buffer> {
  const departments = await loadActiveDepartments(client);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hotpoint Apps Hub";

  const sheet = workbook.addWorksheet(STAFF_SHEET, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map(({ header, width, field }) => ({
    header,
    width,
    style: field === "staffNumber" ? { numFmt: "@" } : undefined,
  }));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };

  const lists = workbook.addWorksheet(DEPARTMENTS_SHEET, { state: "hidden" });
  departments.forEach((name, index) => {
    lists.getCell(index + 1, 1).value = name;
  });
  if (departments.length > 0) {
    const lastRow = STAFF_IMPORT_MAX_ROWS + 1;
    for (let row = 2; row <= lastRow; row++) {
      sheet.getCell(row, 4).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`${DEPARTMENTS_SHEET}!$A$1:$A$${departments.length}`],
        showErrorMessage: true,
        errorTitle: "Department",
        error: "Choose a department from the list",
      };
    }
  }

  const help = workbook.addWorksheet("Instructions");
  help.getColumn(1).width = 110;
  [
    "How to import staff records",
    "",
    `1. Fill in one staff member per row on the "${STAFF_SHEET}" sheet, from row 2. Keep the header row as it is.`,
    "2. Every column is required. Pick the department from the dropdown - only active departments are accepted.",
    "3. Staff numbers and emails must not already be on file, nor repeat within the file. A row identical to a record already on file is skipped.",
    `4. Up to ${STAFF_IMPORT_MAX_ROWS} rows per file. Save as .xlsx.`,
    "5. Upload the file on the Staff directory, check the preview, then import. Nothing is imported until every row passes.",
    "",
    "The import only adds new records - it never changes existing ones. Add the same people in the HR system too.",
  ].forEach((text, index) => {
    const cell = help.getCell(index + 1, 1);
    cell.value = text;
    cell.alignment = { wrapText: true };
    if (index === 0) cell.font = { bold: true, size: 14 };
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// A cell's text as the user sees it: rich text joined, formulas' results,
// hyperlinks' (e.g. auto-linked emails) display text
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((run) => run.text).join("");
    }
    if ("formula" in value || "sharedFormula" in value) {
      const result = (value as ExcelJS.CellFormulaValue).result;
      return typeof result === "object" && result !== null && "error" in result
        ? ""
        : cellText(result as ExcelJS.CellValue);
    }
    if ("text" in value) {
      return cellText(value.text as ExcelJS.CellValue);
    }
    if ("error" in value) return "";
  }
  return String(value);
}

const normalizeHeader = (text: string) =>
  text.trim().toLowerCase().replace(/\s+/g, " ");

type ParsedRow = { rowNumber: number } & Record<Field, string>;

// Reads the uploaded workbook into raw rows, or file-level errors
export async function readStaffWorkbook(
  data: ArrayBuffer,
): Promise<{ rows: ParsedRow[]; fileErrors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data);
  } catch {
    return {
      rows: [],
      fileErrors: [
        "This file couldn't be read. Upload the template saved as an Excel workbook (.xlsx).",
      ],
    };
  }

  const sheet =
    workbook.getWorksheet(STAFF_SHEET) ??
    workbook.worksheets.find((ws) => ws.state === "visible");
  if (!sheet) {
    return {
      rows: [],
      fileErrors: ["The workbook has no worksheet to import."],
    };
  }

  // Columns are found by their header, so their order doesn't matter
  const positions = new Map<Field, number>();
  sheet.getRow(1).eachCell((cell, col) => {
    const header = normalizeHeader(cellText(cell.value));
    const column = COLUMNS.find((c) => c.aliases.includes(header));
    if (column && !positions.has(column.field))
      positions.set(column.field, col);
  });
  const missing = COLUMNS.filter((c) => !positions.has(c.field));
  if (missing.length > 0) {
    return {
      rows: [],
      fileErrors: [
        `The "${sheet.name}" sheet is missing the ${missing
          .map((c) => `"${c.header}"`)
          .join(
            ", ",
          )} column${missing.length > 1 ? "s" : ""}. Use the downloadable template.`,
      ],
    };
  }

  const rows: ParsedRow[] = [];
  let tooMany = false;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || tooMany) return;
    const parsed = { rowNumber } as ParsedRow;
    for (const { field } of COLUMNS) {
      parsed[field] = cellText(row.getCell(positions.get(field)!).value).trim();
    }
    // Rows Excel keeps for formatting alone are skipped
    if (COLUMNS.every(({ field }) => !parsed[field])) return;
    if (rows.length === STAFF_IMPORT_MAX_ROWS) {
      tooMany = true;
      return;
    }
    rows.push(parsed);
  });

  if (tooMany) {
    return {
      rows: [],
      fileErrors: [
        `A file can hold at most ${STAFF_IMPORT_MAX_ROWS} staff. Split it into smaller files.`,
      ],
    };
  }
  if (rows.length === 0) {
    return {
      rows: [],
      fileErrors: [`There are no staff rows on the "${sheet.name}" sheet.`],
    };
  }
  return { rows, fileErrors: [] };
}

type ExistingStaff = {
  id: number;
  staff_number: string;
  staff_name: string;
  staff_email: string;
  staff_department: string;
  staff_location: string;
  number_key: string;
  email_key: string;
  inactive: boolean;
};

const describe = (staff: ExistingStaff) =>
  `${staff.staff_name} (${staff.staff_number}${staff.inactive ? ", inactive" : ""})`;

// Checks every row: required fields and lengths, a valid email, an active
// department (matched ignoring case and stored as the department's own
// name), no repeats within the file, and no clash with a record on file
// unless the row is identical to it. Pass the transaction's client, after
// lockStaffDirectory when the result decides an insert.
export async function checkStaffRows(
  client: Pick<PoolClient, "query">,
  parsed: ParsedRow[],
): Promise<StaffImportCheck> {
  const departments = new Map(
    (await loadActiveDepartments(client)).map((name) => [
      name.toLowerCase(),
      name,
    ]),
  );

  const rows: StaffImportRow[] = parsed.map((row) => {
    const errors: string[] = [];
    for (const { field } of COLUMNS) {
      if (!row[field]) errors.push(`Enter the ${LABELS[field]}`);
      else if (row[field].length > STAFF_FIELD_LIMITS[field]) {
        errors.push(
          `The ${LABELS[field]} cannot be longer than ${STAFF_FIELD_LIMITS[field]} characters`,
        );
      }
    }
    let email = row.email.replace(/^mailto:/i, "");
    if (email) {
      try {
        email = cleanConfigEmail(email);
      } catch (error) {
        if (!(error instanceof ConfigInputError)) throw error;
        errors.push(`"${row.email}" isn't a valid email address`);
      }
    }
    let department = row.department;
    if (department) {
      const active = departments.get(department.toLowerCase());
      if (active) department = active;
      else errors.push(`"${department}" isn't an active department`);
    }
    return {
      rowNumber: row.rowNumber,
      staffNumber: row.staffNumber,
      name: row.name,
      email,
      department,
      location: row.location,
      status: "new" as const,
      errors,
    };
  });

  // Repeats within the file
  const firstByNumber = new Map<string, number>();
  const firstByEmail = new Map<string, number>();
  for (const row of rows) {
    if (row.staffNumber) {
      const key = staffNumberKey(row.staffNumber);
      const first = firstByNumber.get(key);
      if (first)
        row.errors.push(
          `Staff number ${row.staffNumber} is also on row ${first}`,
        );
      else firstByNumber.set(key, row.rowNumber);
    }
    if (row.email) {
      const first = firstByEmail.get(row.email);
      if (first) row.errors.push(`This email is also on row ${first}`);
      else firstByEmail.set(row.email, row.rowNumber);
    }
  }

  // Clashes with records on file, deactivated ones included
  const { rows: existing } = await client.query<ExistingStaff>(
    `SELECT id, staff_number, staff_name, staff_email, staff_department,
     staff_location, ${STAFF_NUMBER_KEY_SQL} AS number_key,
     ${STAFF_EMAIL_KEY_SQL} AS email_key, deactivated_at IS NOT NULL AS inactive
     FROM company_staff_data
     WHERE ${STAFF_NUMBER_KEY_SQL} = ANY($1::text[])
     OR ${STAFF_EMAIL_KEY_SQL} = ANY($2::text[])`,
    [[...firstByNumber.keys()], [...firstByEmail.keys()]],
  );
  const byNumber = new Map(existing.map((s) => [s.number_key, s]));
  const byEmail = new Map(existing.map((s) => [s.email_key, s]));

  for (const row of rows) {
    const numberMatch = row.staffNumber
      ? byNumber.get(staffNumberKey(row.staffNumber))
      : undefined;
    const emailMatch = row.email ? byEmail.get(row.email) : undefined;
    if (!numberMatch && !emailMatch) continue;

    // Ignoring surrounding spaces, which records from the HR-system import
    // often have (e.g. "Modern Trade "), and the department's case
    const identical =
      numberMatch !== undefined &&
      numberMatch === emailMatch &&
      numberMatch.staff_name.trim() === row.name &&
      numberMatch.staff_department.trim().toLowerCase() ===
        row.department.toLowerCase() &&
      numberMatch.staff_location.trim() === row.location;
    if (identical && row.errors.length === 0) {
      row.status = "existing";
      continue;
    }
    if (numberMatch) {
      row.errors.push(
        identical
          ? `Already on file as ${describe(numberMatch)}`
          : `Staff number ${row.staffNumber} is already on file for ${describe(numberMatch)} with different details - edit that record instead`,
      );
    }
    if (emailMatch && emailMatch !== numberMatch) {
      row.errors.push(`This email already belongs to ${describe(emailMatch)}`);
    }
  }

  for (const row of rows) {
    if (row.errors.length > 0) row.status = "error";
  }
  const counts = { new: 0, existing: 0, error: 0 };
  for (const row of rows) counts[row.status]++;
  return { fileErrors: [], rows, counts };
}

// Adds the check's new rows and one config_changes row per record, in one
// statement. The caller holds the lock and has checked there are no errors.
export async function insertStaffRows(
  client: PoolClient,
  actor: SessionPayload,
  check: StaffImportCheck,
  fileName: string,
): Promise<number> {
  const added = check.rows.filter((row) => row.status === "new");
  if (added.length === 0) return 0;

  const { rowCount } = await client.query(
    `WITH added AS (
       INSERT INTO company_staff_data
       (staff_number, staff_name, staff_email, staff_department, staff_location)
       SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::text[])
       RETURNING id, staff_number, staff_name, staff_email, staff_department,
       staff_location
     )
     INSERT INTO config_changes
     (table_name, record_key, action, summary, after_data, changed_by_email,
      changed_by_name)
     SELECT 'company_staff_data', id::text, 'create',
     'Imported staff record ' || staff_name || ' (' || staff_number || ') from ' || $6,
     JSONB_BUILD_OBJECT('staff_number', staff_number, 'staff_name', staff_name,
       'staff_email', staff_email, 'staff_department', staff_department,
       'staff_location', staff_location),
     $7, $8
     FROM added`,
    [
      added.map((row) => row.staffNumber),
      added.map((row) => row.name),
      added.map((row) => row.email),
      added.map((row) => row.department),
      added.map((row) => row.location),
      fileName,
      actor.email,
      actor.name,
    ],
  );
  return rowCount ?? 0;
}
