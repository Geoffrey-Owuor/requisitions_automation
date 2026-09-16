import "server-only";
import { Workbook } from "exceljs";

// Builds a worksheet with header casing (snake_case -> Title Case), a bold
// header row, a fixed column width, and a date/time numFmt for any date-ish
// column — the format shared by every salary-advance Excel export, kept
// here so the manual and cron reports can't silently drift apart.
//
// Without an explicit `columnKeys`, headers are derived from the first row
// and the sheet is skipped entirely when `rows` is empty (there's nothing
// to derive them from). Pass `columnKeys` when the sheet must always exist
// — e.g. a manual export over a date range that may return zero rows but
// still needs to produce an openable workbook.
export function addSheet(
  workbook: Workbook,
  name: string,
  rows: Record<string, unknown>[],
  columnKeys?: string[],
) {
  const keys = columnKeys ?? (rows.length > 0 ? Object.keys(rows[0]) : null);
  if (!keys) return;

  const worksheet = workbook.addWorksheet(name);

  worksheet.columns = keys.map((key) => ({
    header: key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    key,
    width: 20,
    numFmt: ["ated_at", "date"].some((str) => key.includes(str))
      ? "yyyy-mm-dd hh:mm:ss"
      : undefined,
  }));

  worksheet.getRow(1).font = { bold: true };

  if (rows.length > 0) worksheet.addRows(rows);
}

// Removes internal id columns (needed to flip export flags after a send,
// but not meant to appear as worksheet columns) from each row.
export function stripKeys<T extends Record<string, unknown>>(
  rows: T[],
  keys: string[],
): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key))),
  );
}
