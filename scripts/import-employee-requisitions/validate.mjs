import {
  APPROVAL_ORDERS,
  COLUMNS,
  DATA_SHEET,
  DECISIONS,
  REPLACEMENT_OR_NEW,
  RETAIL_DIRECTOR_DECISIONS,
  STAGES,
  stageLabel,
  stageOrder,
} from "./columns.mjs";
import { cellDate, cellNumber, cellText, nairobiToday } from "./cells.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Headers match case-insensitively, ignoring the template's required "*"
const normalizeHeader = (text) =>
  text.replace(/\*\s*$/, "").trim().toLowerCase();

// Whether date-time `a` is before `b`. A value without a time is compared
// by its date alone, so a same-day decision is never "earlier".
function isBefore(a, b) {
  return a.length === 10 || b.length === 10
    ? a.slice(0, 10) < b.slice(0, 10)
    : a < b;
}

// formatSalaryRange in public/assets.ts
const formatSalaryRange = (min, max) => `${min} - ${max}`;

// Reads and checks the Requisitions sheet of a filled-in template, writing
// nothing. Returns:
// - fatal: a message when the sheet can't be read at all
// - issues: { row, key, level: "error" | "warning", message } (key is null
//   for a problem with the row as a whole)
// - requisitions: every requisition as it would be stored, when there are
//   no errors
// - columnIndex: column key -> sheet column number, for the issue report
export async function validateWorkbook(workbook, client, lookups) {
  const sheet = workbook.getWorksheet(DATA_SHEET);
  if (!sheet) {
    return { fatal: `The workbook has no "${DATA_SHEET}" sheet` };
  }

  const columnIndex = new Map();
  sheet.getRow(1).eachCell((cell, col) => {
    const header = normalizeHeader(cellText(cell.value));
    const column = COLUMNS.find((c) => c.header.toLowerCase() === header);
    if (column && !columnIndex.has(column.key)) {
      columnIndex.set(column.key, col);
    }
  });
  const missing = COLUMNS.filter((c) => !columnIndex.has(c.key));
  if (missing.length > 0) {
    return {
      fatal: `The ${DATA_SHEET} sheet is missing these columns: ${missing
        .map((c) => c.header)
        .join(", ")}`,
    };
  }

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const raw = {};
    let hasValue = false;
    for (const column of COLUMNS) {
      raw[column.key] = row.getCell(columnIndex.get(column.key)).value;
      if (cellText(raw[column.key]) !== "") hasValue = true;
    }
    if (hasValue) rows.push({ rowNumber: r, raw });
  }

  const issues = [];
  const addIssue = (level) => (row, key, message) =>
    issues.push({ row, key, level, message });
  const error = addIssue("error");
  const warn = addIssue("warning");

  if (rows.length === 0) {
    return {
      fatal: `The ${DATA_SHEET} sheet has no rows to import`,
    };
  }

  const today = nairobiToday();
  const departments = new Map(
    lookups.departments.map((d) => [d.name.toLowerCase(), d]),
  );
  const grades = new Map(lookups.grades.map((g) => [g.name.toLowerCase(), g]));

  // Readers for one row's cells: each returns the value, or undefined after
  // recording an error (or when an optional cell is blank)
  const readers = (rowNumber, raw) => {
    const text = (key, { required = false, max } = {}) => {
      const value = cellText(raw[key]);
      if (!value) {
        if (required) error(rowNumber, key, "Required");
        return undefined;
      }
      if (max && value.length > max) {
        error(rowNumber, key, `Must be at most ${max} characters`);
        return undefined;
      }
      return value;
    };
    return {
      text,
      email: (key, options) => {
        const value = text(key, { ...options, max: 255 });
        if (value === undefined) return undefined;
        if (!EMAIL_PATTERN.test(value)) {
          error(rowNumber, key, "Isn't an email address");
          return undefined;
        }
        return value.toLowerCase();
      },
      date: (key, { required = false, allowTime = false, notFuture = false }) => {
        if (cellText(raw[key]) === "") {
          if (required) error(rowNumber, key, "Required");
          return undefined;
        }
        const result = cellDate(raw[key], { allowTime });
        if (result.error) {
          error(rowNumber, key, result.error);
          return undefined;
        }
        if (notFuture && result.value.slice(0, 10) > today) {
          error(rowNumber, key, "Can't be in the future");
          return undefined;
        }
        return result.value;
      },
      choice: (key, options, { required = false } = {}) => {
        const value = cellText(raw[key]);
        if (!value) {
          if (required) error(rowNumber, key, "Required");
          return undefined;
        }
        const match = options.find(
          (option) => option.toLowerCase() === value.toLowerCase(),
        );
        if (!match) {
          error(rowNumber, key, `Must be one of: ${options.join(", ")}`);
        }
        return match;
      },
      number: (key) => {
        if (cellText(raw[key]) === "") {
          error(rowNumber, key, "Required");
          return undefined;
        }
        const result = cellNumber(raw[key]);
        if (result.error) {
          error(rowNumber, key, result.error);
          return undefined;
        }
        return result.value;
      },
    };
  };

  // Group rows by Legacy Ref (case-insensitively, since a reference that
  // differs only in case is almost certainly a typo)
  const groups = new Map();
  for (const row of rows) {
    const ref = readers(row.rowNumber, row.raw).text("legacyRef", {
      required: true,
      max: 100,
    });
    if (ref === undefined) continue;
    const key = ref.toLowerCase();
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { ref, rows: [row] });
    } else if (group.ref !== ref) {
      error(
        row.rowNumber,
        "legacyRef",
        `Spelled differently from row ${group.rows[0].rowNumber} (${group.ref})`,
      );
    } else {
      group.rows.push(row);
    }
  }

  // Legacy Refs already imported by an earlier run
  const existing = await client.query(
    `SELECT legacy_reference, TO_CHAR(imported_at, 'YYYY-MM-DD') AS imported_on
     FROM employee_requisitions WHERE LOWER(legacy_reference) = ANY($1)`,
    [[...groups.keys()]],
  );
  for (const row of existing.rows) {
    const group = groups.get(row.legacy_reference.toLowerCase());
    error(
      group.rows[0].rowNumber,
      "legacyRef",
      `Already imported on ${row.imported_on} as ${row.legacy_reference}`,
    );
  }

  const requisitionColumns = COLUMNS.filter(
    (c) => c.level === "requisition" && c.key !== "legacyRef",
  );
  const comparable = (column, value) =>
    (column.kind === "date"
      ? (cellDate(value, { allowTime: true }).value ?? cellText(value))
      : cellText(value)
    ).toLowerCase();

  const requisitions = [];

  for (const { ref, rows: groupRows } of groups.values()) {
    const [first, ...rest] = groupRows;

    // A requisition's columns come from its first row; later rows leave
    // them blank or repeat them exactly
    for (const row of rest) {
      for (const column of requisitionColumns) {
        const value = comparable(column, row.raw[column.key]);
        if (value !== "" && value !== comparable(column, first.raw[column.key])) {
          error(
            row.rowNumber,
            column.key,
            `Doesn't match row ${first.rowNumber}, the first row of ${ref} - leave it blank or make it the same`,
          );
        }
      }
    }

    const rowNumber = first.rowNumber;
    const read = readers(rowNumber, first.raw);
    const submittedAt = read.date("submittedDate", {
      required: true,
      allowTime: true,
      notFuture: true,
    });
    const submitterName = read.text("submitterName", {
      required: true,
      max: 255,
    });
    const submitterEmail = read.email("submitterEmail", { required: true });

    const departmentName = read.text("department", { required: true });
    const department =
      departmentName === undefined
        ? undefined
        : departments.get(departmentName.toLowerCase());
    if (departmentName !== undefined && !department) {
      error(rowNumber, "department", "Isn't a department in the Apps Hub");
    }

    const orderName = read.choice("approvalOrder", Object.keys(APPROVAL_ORDERS), {
      required: true,
    });
    const hrBeforeDirector =
      orderName === undefined ? undefined : APPROVAL_ORDERS[orderName];

    const stages = readStages({
      rowNumber,
      raw: first.raw,
      read,
      error,
      warn,
      submittedAt,
      hrBeforeDirector,
      department,
    });

    const positions = groupRows.map((row) =>
      readPosition(row, readers(row.rowNumber, row.raw), grades, error),
    );

    requisitions.push({
      legacyRef: ref,
      rows: groupRows.map((row) => row.rowNumber),
      submittedAt,
      submitterName,
      submitterEmail,
      department: department?.name,
      hrBeforeDirector,
      stages,
      positions,
    });
  }

  return {
    issues,
    columnIndex,
    rowCount: rows.length,
    requisitions: issues.some((i) => i.level === "error") ? [] : requisitions,
  };
}

// The approval stages, in the requisition's order. Each stage is decided up
// to the final approval or the first decline; stages after a decline were
// never reached and are stored the way a live decline leaves them.
function readStages({
  rowNumber,
  raw,
  read,
  error,
  warn,
  submittedAt,
  hrBeforeDirector,
  department,
}) {
  const stages = {};
  const decisions = {};
  for (const { key } of STAGES) {
    const options =
      key === "retail_director" ? RETAIL_DIRECTOR_DECISIONS : DECISIONS;
    decisions[key] = read.choice(`${key}.decision`, options);
  }

  // Without a valid order the sequence can't be checked
  if (hrBeforeDirector === undefined) return stages;

  let declinedBy = null;
  let previous = submittedAt
    ? { date: submittedAt, label: "the Submitted Date" }
    : null;

  for (const key of stageOrder(hrBeforeDirector)) {
    const label = stageLabel(key);
    const decision = decisions[key];
    const decisionCell = cellText(raw[`${key}.decision`]);
    // An invalid decision was already reported
    if (decisionCell !== "" && decision === undefined) continue;

    if (declinedBy) {
      if (decision === "Approved" || decision === "Declined") {
        error(
          rowNumber,
          `${key}.decision`,
          `Must be blank - ${declinedBy} declined this requisition, so the ${label} stage was never reached`,
        );
        continue;
      }
    } else if (decision === undefined) {
      error(
        rowNumber,
        `${key}.decision`,
        key === "retail_director"
          ? "Required - Approved, Declined, or N/A when the department didn't need a Retail Director"
          : "Required - every stage is decided up to the final approval or the first decline (pending requisitions can't be imported)",
      );
      continue;
    }

    const decided = decision === "Approved" || decision === "Declined";
    if (decision === "Declined") declinedBy = label;

    if (key === "retail_director" && department) {
      if (decision === "N/A" && department.requiresRetailDirector) {
        warn(
          rowNumber,
          `${key}.decision`,
          `${department.name} needs a Retail Director today - check this is right for when it was submitted`,
        );
      } else if (decided && !department.requiresRetailDirector) {
        warn(
          rowNumber,
          `${key}.decision`,
          `${department.name} doesn't need a Retail Director today - check this is right for when it was submitted`,
        );
      }
    }

    if (!decided) {
      for (const field of ["name", "email", "date", "comments"]) {
        if (cellText(raw[`${key}.${field}`]) !== "") {
          error(
            rowNumber,
            `${key}.${field}`,
            `Must be blank - the ${label} stage wasn't decided`,
          );
        }
      }
      stages[key] = {
        // Never reached: pending, or N/A where the stage doesn't apply - as
        // the app stores a Retail Director stage the department doesn't use
        status:
          decision === "N/A" ||
          (key === "retail_director" &&
            department &&
            !department.requiresRetailDirector)
            ? "N/A"
            : "pending",
      };
      continue;
    }

    const name = read.text(`${key}.name`, { required: true, max: 255 });
    const email = read.email(`${key}.email`, { required: true });
    const date = read.date(`${key}.date`, {
      required: true,
      allowTime: true,
      notFuture: true,
    });
    const comments = read.text(`${key}.comments`);

    if (date && previous && isBefore(date, previous.date)) {
      error(
        rowNumber,
        `${key}.date`,
        `Can't be earlier than ${previous.label} (${previous.date})`,
      );
    }
    if (date) previous = { date, label: `the ${label} Date` };

    stages[key] = {
      status: decision.toLowerCase(),
      name,
      email,
      date,
      comments: comments ?? null,
    };
  }

  return stages;
}

function readPosition(row, read, grades, error) {
  const numberRequired = read.number("numberRequired");
  if (
    numberRequired !== undefined &&
    (!Number.isInteger(numberRequired) || numberRequired < 1)
  ) {
    error(row.rowNumber, "numberRequired", "Must be a whole number, 1 or more");
  }

  const gradeName = read.text("jobGrade", { required: true });
  const grade =
    gradeName === undefined ? undefined : grades.get(gradeName.toLowerCase());
  if (gradeName !== undefined && !grade) {
    error(row.rowNumber, "jobGrade", "Isn't a job grade in the Apps Hub");
  }

  const salaryMin = read.number("salaryMin");
  const salaryMax = read.number("salaryMax");
  if (salaryMin !== undefined && salaryMin <= 0) {
    error(row.rowNumber, "salaryMin", "Must be greater than 0");
  }
  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    salaryMax < salaryMin
  ) {
    error(row.rowNumber, "salaryMax", "Can't be less than Salary Min");
  }

  return {
    row: row.rowNumber,
    title: read.text("positionTitle", { required: true, max: 100 }),
    numberRequired,
    replacementOrNew: read.choice("replacementOrNew", REPLACEMENT_OR_NEW, {
      required: true,
    }),
    jobGrade: grade?.name,
    jobGradeRank: grade?.rank,
    salaryRange:
      salaryMin !== undefined && salaryMax !== undefined
        ? formatSalaryRange(salaryMin, salaryMax)
        : undefined,
    justification: read.text("justification", { required: true }),
    reportingTo: read.text("reportingTo", { required: true, max: 100 }),
    targetFillDate: read.date("targetFillDate", { required: true }),
  };
}
