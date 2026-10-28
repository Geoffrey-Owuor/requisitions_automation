// One-time import of past Employee Requisitions from Excel. See README.md.
//
//   node --env-file=<env file> scripts/import-employee-requisitions/index.mjs template [output.xlsx]
//   node --env-file=<env file> scripts/import-employee-requisitions/index.mjs validate <file.xlsx>
//   node --env-file=<env file> scripts/import-employee-requisitions/index.mjs import <file.xlsx> [--commit]
//   node --env-file=<env file> scripts/import-employee-requisitions/index.mjs undo <batch-id> [--commit]

import path from "node:path";
import ExcelJS from "exceljs";
import { connect, loadLookups } from "./db.mjs";
import { writeTemplate } from "./template.mjs";
import { validateWorkbook } from "./validate.mjs";
import { columnHeader, sortIssues, writeIssueReport } from "./report.mjs";
import { importRequisitions, undoBatch } from "./import.mjs";

const USAGE = `Usage:
  index.mjs template [output.xlsx]   Build the Excel template from the database
  index.mjs validate <file.xlsx>     Check a filled-in template (writes nothing to the database)
  index.mjs import <file.xlsx>       Check, then insert everything and roll back (a dry run)
  index.mjs import <file.xlsx> --commit
                                     Check, then insert everything in one transaction
  index.mjs undo <batch-id>          Show how many requisitions an import batch holds
  index.mjs undo <batch-id> --commit Delete an import batch`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// How many issues to print; the report file has them all
const PRINTED_ISSUES = 25;

// Validating a report again updates it in place
const reportPath = (file) =>
  path.join(
    path.dirname(file),
    `${path.basename(file, path.extname(file)).replace(/\.errors$/, "")}.errors.xlsx`,
  );

async function template(client, output = "employee-requisitions-import.xlsx") {
  const lookups = await loadLookups(client);
  await writeTemplate(output, lookups);
  console.log(
    `Wrote ${output} (${lookups.departments.length} departments, ${lookups.grades.length} job grades)`,
  );
}

// Reads and checks a file, printing a summary and writing the issue report.
// Returns the validation result, or null when the file can't be imported.
async function checkFile(client, file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const lookups = await loadLookups(client);
  const result = await validateWorkbook(workbook, client, lookups);

  if (result.fatal) {
    console.error(`Can't read ${file}: ${result.fatal}`);
    return null;
  }

  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");
  const requisitionCount = new Set(
    result.requisitions.map((r) => r.legacyRef),
  ).size;

  console.log(
    `${file}: ${result.rowCount} position rows, ${errors.length} errors, ${warnings.length} warnings`,
  );

  if (result.issues.length > 0) {
    for (const issue of sortIssues(result.issues).slice(0, PRINTED_ISSUES)) {
      console.log(
        `  Row ${issue.row}, ${columnHeader(issue.key)} [${issue.level}]: ${issue.message}`,
      );
    }
    if (result.issues.length > PRINTED_ISSUES) {
      console.log(`  ...and ${result.issues.length - PRINTED_ISSUES} more`);
    }
    const report = reportPath(file);
    await writeIssueReport(file, report, result);
    console.log(`Wrote ${report} with every issue highlighted`);
  }

  if (errors.length > 0) {
    console.log("Fix the errors and validate again. Nothing can be imported until there are none.");
    return null;
  }

  const positions = result.requisitions.reduce(
    (sum, r) => sum + r.positions.length,
    0,
  );
  console.log(
    `Ready to import ${requisitionCount} requisitions with ${positions} positions` +
      (warnings.length > 0 ? " (check the warnings first)" : ""),
  );
  return result;
}

async function importFile(client, file, commit) {
  const result = await checkFile(client, file);
  if (!result) {
    process.exitCode = 1;
    return;
  }
  const { batchId, requisitions, positions } = await importRequisitions(
    client,
    result.requisitions,
    { commit },
  );
  if (!commit) {
    console.log(
      `Dry run: inserted ${requisitions} requisitions and ${positions} positions, then rolled back. Run again with --commit to import.`,
    );
    return;
  }
  console.log(
    `Imported ${requisitions} requisitions and ${positions} positions as batch ${batchId}`,
  );
  console.log(
    `Keep the batch id. To undo: index.mjs undo ${batchId} --commit`,
  );
}

async function undo(client, batchId, commit) {
  if (!UUID_PATTERN.test(batchId)) {
    console.error(`${batchId} isn't a batch id`);
    process.exitCode = 1;
    return;
  }
  const count = await undoBatch(client, batchId, { commit });
  console.log(
    commit
      ? `Deleted ${count} requisitions from batch ${batchId}`
      : `Batch ${batchId} has ${count} requisitions. Run again with --commit to delete them.`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const [command, target] = args.filter((arg) => arg !== "--commit");
  const needsTarget = ["validate", "import", "undo"].includes(command);
  if ((command !== "template" && !needsTarget) || (needsTarget && !target)) {
    console.error(USAGE);
    process.exit(1);
  }

  const client = await connect();
  try {
    if (command === "template") {
      await template(client, target);
    } else if (command === "validate") {
      const result = await checkFile(client, target);
      if (!result) process.exitCode = 1;
    } else if (command === "import") {
      await importFile(client, target, commit);
    } else {
      await undo(client, target, commit);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
