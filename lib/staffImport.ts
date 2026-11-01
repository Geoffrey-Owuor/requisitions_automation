// Client-safe shapes and limits of the Staff directory's Excel import
// (app/api/salaryadvance/staff-import, lib/staffImportWorkbook.ts). The
// import only ever adds records: a row whose staff number or email is
// already on file is an error unless it matches that record exactly, and
// nothing is imported until every row passes.

export const STAFF_IMPORT_URL = "/api/salaryadvance/staff-import";
export const STAFF_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const STAFF_IMPORT_MAX_ROWS = 1000;

export type StaffImportRowStatus = "new" | "existing" | "error";

export interface StaffImportRow {
  // The row's number in the worksheet, as Excel shows it
  rowNumber: number;
  staffNumber: string;
  name: string;
  email: string;
  department: string;
  location: string;
  status: StaffImportRowStatus;
  errors: string[];
}

export interface StaffImportCheck {
  // Problems with the file as a whole (wrong columns, too many rows...);
  // when there are any, `rows` is empty
  fileErrors: string[];
  rows: StaffImportRow[];
  counts: Record<StaffImportRowStatus, number>;
}

// POST responses: a check, or the import's outcome. A refused import
// returns the fresh check (409) so the preview shows why.
export type StaffImportResponse =
  | { mode: "check"; check: StaffImportCheck }
  | { mode: "import"; imported: number; skipped: number; message: string }
  | { mode: "refused"; check: StaffImportCheck; message: string }
  | { message: string };
