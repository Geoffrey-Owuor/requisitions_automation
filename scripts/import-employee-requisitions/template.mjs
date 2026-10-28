import ExcelJS from "exceljs";
import {
  APPROVAL_ORDERS,
  COLUMNS,
  DATA_SHEET,
  DECISIONS,
  LISTS_SHEET,
  REPLACEMENT_OR_NEW,
  RETAIL_DIRECTOR_DECISIONS,
} from "./columns.mjs";

// Rows of the Requisitions sheet that get dropdowns and formats
const DATA_ROWS = 2000;

const HEADER_FILLS = {
  requisition: "FFFCE7F3",
  position: "FFEDE9FE",
  stage: "FFE0F2FE",
};

const headerFill = (column) =>
  column.stage ? HEADER_FILLS.stage : HEADER_FILLS[column.level];

const headerText = (column) =>
  column.required ? `${column.header} *` : column.header;

const columnLetter = (index) => {
  let n = index;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

const inlineList = (options) => [`"${options.join(",")}"`];

// The worked example: two requisitions, three positions. The second row of
// REQ-2023-014 leaves the requisition columns blank, as allowed.
function exampleRows(department, grades) {
  const grade = (i) => grades[Math.min(i, grades.length - 1)]?.name ?? "";
  const stage = (decision, name, email, date, comments = "") => ({
    decision,
    name,
    email,
    date,
    comments,
  });
  const blank = stage("", "", "", "");
  const rows = [
    {
      legacyRef: "REQ-2023-014",
      submittedDate: "2023-05-02",
      submitterName: "Jane Wanjiku",
      submitterEmail: "jane.wanjiku@hotpoint.co.ke",
      department,
      approvalOrder: "HR before CEO",
      positionTitle: "Sales Executive",
      numberRequired: 2,
      replacementOrNew: "New",
      jobGrade: grade(3),
      salaryMin: 60000,
      salaryMax: 80000,
      justification: "Two new branches opening in Q3",
      reportingTo: "Branch Manager",
      targetFillDate: "2023-07-01",
      hod: stage("Approved", "Peter Otieno", "peter.otieno@hotpoint.co.ke", "2023-05-03"),
      retail_director: stage("N/A", "", "", ""),
      hr: stage("Approved", "Mary Akinyi", "mary.akinyi@hotpoint.co.ke", "2023-05-05"),
      director: stage("Approved", "John Kamau", "john.kamau@hotpoint.co.ke", "2023-05-09", "Approved for both branches"),
    },
    {
      legacyRef: "REQ-2023-014",
      positionTitle: "Sales Supervisor",
      numberRequired: 1,
      replacementOrNew: "Replacement",
      jobGrade: grade(4),
      salaryMin: 90000,
      salaryMax: 110000,
      justification: "Replaces a supervisor who resigned",
      reportingTo: "Branch Manager",
      targetFillDate: "2023-06-15",
    },
    {
      legacyRef: "REQ-2023-021",
      submittedDate: "2023-06-12",
      submitterName: "Ali Hassan",
      submitterEmail: "ali.hassan@hotpoint.co.ke",
      department,
      approvalOrder: "CEO before HR",
      positionTitle: "Accounts Assistant",
      numberRequired: 1,
      replacementOrNew: "New",
      jobGrade: grade(0),
      salaryMin: 40000,
      salaryMax: 50000,
      justification: "Month-end workload",
      reportingTo: "Finance Manager",
      targetFillDate: "2023-08-01",
      hod: stage("Approved", "Grace Njeri", "grace.njeri@hotpoint.co.ke", "2023-06-13"),
      retail_director: stage("N/A", "", "", ""),
      director: stage("Declined", "John Kamau", "john.kamau@hotpoint.co.ke", "2023-06-20", "Not in this year's budget"),
      hr: blank,
    },
  ];

  return rows.map((row) =>
    COLUMNS.map((column) => {
      if (!column.stage) return row[column.key] ?? "";
      return row[column.stage]?.[column.field] ?? "";
    }),
  );
}

function writeHeaderRow(row, columns) {
  columns.forEach((column, i) => {
    const cell = row.getCell(i + 1);
    cell.value = headerText(column);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: headerFill(column) },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  row.height = 32;
}

function addInstructions(workbook, lookups) {
  const sheet = workbook.addWorksheet("Instructions");
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 44;
  sheet.getColumn(4).width = 90;

  const title = sheet.addRow(["Employee Requisition import"]);
  title.font = { bold: true, size: 16 };
  sheet.addRow([]);

  const paragraphs = [
    `Fill in the ${DATA_SHEET} sheet: one row per position. Rows with the same Legacy Ref are the positions of one requisition.`,
    "Pink columns describe the requisition and blue columns its approvals: fill them on a requisition's first row. On its later rows, leave them blank or repeat them exactly. Purple columns describe the row's own position. Columns marked * are required.",
    "Dates: use real Excel dates, or text as YYYY-MM-DD (e.g. 2023-05-02). Text like 03/04/2023 is rejected, since it could mean 3 April or 4 March. Approval dates may include a time.",
    "Only finished requisitions can be imported: every stage approved, or one stage declined. A requisition still waiting on someone must be submitted through the Apps Hub instead, so its approvers are notified.",
    "Approvals: following the requisition's Approval Order (HOD, Retail Director, then HR and the CEO in the order chosen), decide every stage up to the final approval or the first decline. Leave the stages after a decline blank. A decided stage needs the approver's name, email and date, and its date can't be earlier than the submission or an earlier stage.",
    "Retail Director is N/A when the department didn't need one. The check compares it with today's department settings and only warns, since they may have changed.",
    `Departments and job grades must match the ${LISTS_SHEET} sheet (inactive ones are allowed). Emails are stored in lowercase.`,
    "No documents (Job Description, KPIs, Org Chart) are imported. Imported requisitions show as Imported, can't be amended, and send no emails.",
    "Before importing, run the validate command. It writes nothing, and saves a copy of the file ending in .errors.xlsx with every problem highlighted (red: must fix, yellow: check) and listed on an Issues sheet.",
  ];
  for (const text of paragraphs) {
    const row = sheet.addRow([text]);
    sheet.mergeCells(row.number, 1, row.number, 4);
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
    row.height = 32;
  }

  sheet.addRow([]);
  const tableTitle = sheet.addRow(["Columns"]);
  tableTitle.font = { bold: true, size: 13 };
  const tableHeader = sheet.addRow(["Column", "Required", "Accepts", "Notes"]);
  tableHeader.font = { bold: true };
  for (const column of COLUMNS) {
    const row = sheet.addRow([
      column.header,
      column.required ? "Yes" : "",
      column.accepts,
      column.notes ?? "",
    ]);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: headerFill(column) },
    };
    row.alignment = { wrapText: true, vertical: "top" };
  }

  sheet.addRow([]);
  const exampleTitle = sheet.addRow([
    "Worked example: two requisitions, three positions (copy rows into the Requisitions sheet as a starting point)",
  ]);
  exampleTitle.font = { bold: true, size: 13 };

  // The example sits in its own block below, with the data sheet's columns
  const header = sheet.addRow([]);
  writeHeaderRow(header, COLUMNS);
  // One without a Retail Director stage, matching the example's N/A
  const department =
    lookups.departments.find((d) => d.isActive && !d.requiresRetailDirector)
      ?.name ?? "";
  for (const values of exampleRows(department, lookups.grades)) {
    sheet.addRow(values);
  }
}

function addDataSheet(workbook, lookups) {
  const sheet = workbook.addWorksheet(DATA_SHEET, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });
  writeHeaderRow(sheet.getRow(1), COLUMNS);

  const departmentsRange = `${LISTS_SHEET}!$A$2:$A$${lookups.departments.length + 1}`;
  const gradesRange = `${LISTS_SHEET}!$E$2:$E$${lookups.grades.length + 1}`;

  COLUMNS.forEach((column, i) => {
    const letter = columnLetter(i + 1);
    sheet.getColumn(i + 1).width = column.width;

    if (column.kind === "date") {
      for (let r = 2; r <= DATA_ROWS; r++) {
        sheet.getCell(`${letter}${r}`).numFmt = "yyyy-mm-dd";
      }
    } else if (!column.kind) {
      // Text, so Excel doesn't turn a reference like 2023-014 into a date
      for (let r = 2; r <= DATA_ROWS; r++) {
        sheet.getCell(`${letter}${r}`).numFmt = "@";
      }
    }

    let formulae;
    if (column.key === "department") formulae = [departmentsRange];
    else if (column.key === "jobGrade") formulae = [gradesRange];
    else if (column.key === "approvalOrder") {
      formulae = inlineList(Object.keys(APPROVAL_ORDERS));
    } else if (column.key === "replacementOrNew") {
      formulae = inlineList(REPLACEMENT_OR_NEW);
    } else if (column.field === "decision") {
      formulae = inlineList(
        column.stage === "retail_director"
          ? RETAIL_DIRECTOR_DECISIONS
          : DECISIONS,
      );
    }
    if (formulae) {
      sheet.dataValidations.add(`${letter}2:${letter}${DATA_ROWS}`, {
        type: "list",
        allowBlank: true,
        formulae,
        showErrorMessage: true,
        errorStyle: "stop",
        errorTitle: column.header,
        error: `Choose a value from the list (${column.accepts})`,
      });
    }
  });
}

function addListsSheet(workbook, lookups) {
  const sheet = workbook.addWorksheet(LISTS_SHEET);
  const header = sheet.getRow(1);
  header.values = [
    "Department",
    "Active",
    "Needs Retail Director",
    "",
    "Job Grade",
    "Rank",
    "Active",
  ];
  header.font = { bold: true };
  lookups.departments.forEach((d, i) => {
    const row = sheet.getRow(i + 2);
    row.getCell(1).value = d.name;
    row.getCell(2).value = d.isActive ? "Yes" : "No";
    row.getCell(3).value = d.requiresRetailDirector ? "Yes" : "No";
  });
  lookups.grades.forEach((g, i) => {
    const row = sheet.getRow(i + 2);
    row.getCell(5).value = g.name;
    row.getCell(6).value = g.rank;
    row.getCell(7).value = g.isActive ? "Yes" : "No";
  });
  [28, 8, 20, 4, 22, 8, 8].forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

// Builds the import template from the live departments and job grades
export async function writeTemplate(outputPath, lookups) {
  const workbook = new ExcelJS.Workbook();
  addInstructions(workbook, lookups);
  addDataSheet(workbook, lookups);
  addListsSheet(workbook, lookups);
  await workbook.xlsx.writeFile(outputPath);
}
