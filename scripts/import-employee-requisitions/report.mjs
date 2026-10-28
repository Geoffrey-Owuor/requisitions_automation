import ExcelJS from "exceljs";
import { COLUMNS, DATA_SHEET } from "./columns.mjs";
import { cellText } from "./cells.mjs";

const ISSUES_HEADER = "Issues";
const ISSUES_SHEET = "Issues";
const FILLS = {
  error: "FFFECACA",
  warning: "FFFEF08A",
};

const columnHeader = (key) =>
  key ? COLUMNS.find((c) => c.key === key).header : "(row)";

// Writes a copy of the input workbook with every issue highlighted: the
// cell filled (red for an error, yellow for a warning) with the reason as a
// note, an Issues column summing up each row, and an Issues sheet listing
// them all. Re-validating a report replaces its highlights.
export async function writeIssueReport(inputPath, outputPath, result) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  const sheet = workbook.getWorksheet(DATA_SHEET);
  const { issues, columnIndex } = result;

  let issuesColumn;
  sheet.getRow(1).eachCell((cell, col) => {
    if (cellText(cell.value) === ISSUES_HEADER) issuesColumn = col;
  });
  issuesColumn ??= sheet.columnCount + 1;

  // Clear an earlier report's highlights
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    for (const col of columnIndex.values()) {
      const cell = row.getCell(col);
      cell.fill = { type: "pattern", pattern: "none" };
      cell.note = undefined;
    }
    row.getCell(issuesColumn).value = null;
  }

  const header = sheet.getRow(1).getCell(issuesColumn);
  header.value = ISSUES_HEADER;
  header.font = { bold: true, color: { argb: "FFB91C1C" } };
  sheet.getColumn(issuesColumn).width = 60;

  const byRow = new Map();
  for (const issue of issues) {
    if (!byRow.has(issue.row)) byRow.set(issue.row, []);
    byRow.get(issue.row).push(issue);

    if (!issue.key) continue;
    const cell = sheet.getRow(issue.row).getCell(columnIndex.get(issue.key));
    const isError = issue.level === "error";
    // An error's red wins over a warning's yellow on the same cell
    if (isError || cell.fill?.fgColor?.argb !== FILLS.error) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: FILLS[issue.level] },
      };
    }
    const prefix = isError ? "Error" : "Warning";
    const existing = typeof cell.note === "string" ? `${cell.note}\n` : "";
    cell.note = `${existing}${prefix}: ${issue.message}`;
  }

  for (const [rowNumber, rowIssues] of byRow) {
    const cell = sheet.getRow(rowNumber).getCell(issuesColumn);
    cell.value = rowIssues
      .map(
        (i) =>
          `${i.level === "error" ? "Error" : "Warning"} - ${columnHeader(i.key)}: ${i.message}`,
      )
      .join("\n");
    cell.alignment = { wrapText: true, vertical: "top" };
  }

  const old = workbook.getWorksheet(ISSUES_SHEET);
  if (old) workbook.removeWorksheet(old.id);
  const list = workbook.addWorksheet(ISSUES_SHEET);
  list.columns = [
    { header: "Row", key: "row", width: 8 },
    { header: "Column", key: "column", width: 24 },
    { header: "Level", key: "level", width: 10 },
    { header: "Problem", key: "message", width: 90 },
  ];
  list.getRow(1).font = { bold: true };
  list.views = [{ state: "frozen", ySplit: 1 }];
  for (const issue of sortIssues(issues)) {
    list.addRow({
      row: issue.row,
      column: columnHeader(issue.key),
      level: issue.level,
      message: issue.message,
    });
  }

  await workbook.xlsx.writeFile(outputPath);
}

const columnOrder = (key) =>
  key ? COLUMNS.findIndex((c) => c.key === key) : -1;

export const sortIssues = (issues) =>
  [...issues].sort(
    (a, b) => a.row - b.row || columnOrder(a.key) - columnOrder(b.key),
  );

export { columnHeader };
