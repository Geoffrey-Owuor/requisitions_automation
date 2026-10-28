import { randomUUID } from "node:crypto";

// A "YYYY-MM-DD[ HH:MM]" Nairobi wall-clock value as a stored timestamp,
// which is in the database session's time zone like every timestamp the
// app writes (createdInRange in lib/reports/sql.ts reads them back the same
// way). NULL stays NULL.
const nairobi = (param) =>
  `((${param})::timestamp AT TIME ZONE 'Africa/Nairobi')::timestamp`;

const stageColumns = (prefix) => [
  `employee_${prefix}_approval_status`,
  `employee_${prefix}_approver`,
  `employee_${prefix}_email`,
  `employee_${prefix}_comments`,
  `employee_${prefix}_approval_date`,
];

const STAGE_KEYS = ["hod", "retail_director", "hr", "director"];

const HEADER_COLUMNS = [
  "request_created_at",
  "submitter_email",
  "submitter_name",
  "employee_department",
  ...STAGE_KEYS.flatMap(stageColumns),
  "employee_hod_actioned_by_email",
  "hr_before_director",
  "import_batch_id",
  "legacy_reference",
];

const DATE_COLUMNS = new Set([
  "request_created_at",
  ...STAGE_KEYS.map((key) => `employee_${key}_approval_date`),
]);

const INSERT_REQUISITION = `
  INSERT INTO employee_requisitions (${HEADER_COLUMNS.join(", ")}, imported_at)
  VALUES (${HEADER_COLUMNS.map((column, i) =>
    DATE_COLUMNS.has(column) ? nairobi(`$${i + 1}`) : `$${i + 1}`,
  ).join(", ")}, NOW())
  RETURNING request_id`;

// Positions keep the file's row order: the app lists them by
// position_created_at, so each is a millisecond after the previous one
const INSERT_POSITION = `
  INSERT INTO employee_requisition_positions (
    request_id, position_title, number_required, position_replacement_or_new,
    position_job_grade, position_job_grade_rank, position_salary_range,
    position_justification, position_reporting_to, date_position_filled,
    position_created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date,
    ${nairobi("$11")} + ($12::float8 * INTERVAL '1 millisecond'))`;

function headerValues(requisition, batchId) {
  const stageValues = STAGE_KEYS.flatMap((key) => {
    const stage = requisition.stages[key];
    return [
      stage.status,
      stage.name ?? null,
      stage.email ?? null,
      stage.comments ?? null,
      stage.date ?? null,
    ];
  });
  return [
    requisition.submittedAt,
    requisition.submitterEmail,
    requisition.submitterName,
    requisition.department,
    ...stageValues,
    // The HOD who acted is the assigned HOD (migration 018)
    requisition.stages.hod.email,
    requisition.hrBeforeDirector,
    batchId,
    requisition.legacyRef,
  ];
}

// Writes every validated requisition in one transaction under a new batch
// id, committing only with `commit`; otherwise it rolls back, so a dry run
// also proves the database accepts every row. Any failure writes nothing.
export async function importRequisitions(client, requisitions, { commit }) {
  const batchId = randomUUID();
  let positions = 0;

  await client.query("BEGIN");
  try {
    for (const requisition of requisitions) {
      const { rows } = await client.query(
        INSERT_REQUISITION,
        headerValues(requisition, batchId),
      );
      const requestId = rows[0].request_id;

      for (const [index, position] of requisition.positions.entries()) {
        await client.query(INSERT_POSITION, [
          requestId,
          position.title,
          position.numberRequired,
          position.replacementOrNew,
          position.jobGrade,
          position.jobGradeRank,
          position.salaryRange,
          position.justification,
          position.reportingTo,
          position.targetFillDate,
          requisition.submittedAt,
          index,
        ]);
        positions++;
      }
    }

    await client.query(commit ? "COMMIT" : "ROLLBACK");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  return { batchId, requisitions: requisitions.length, positions };
}

// Deletes one import batch (positions cascade). Refuses rows that aren't
// imported or that changed since, which nothing should do - imported rows
// can't be amended - but a delete must never take live data with it.
export async function undoBatch(client, batchId, { commit }) {
  await client.query("BEGIN");
  try {
    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE imported_at IS NULL OR amendment_count > 0)::int AS changed
       FROM employee_requisitions WHERE import_batch_id = $1`,
      [batchId],
    );
    const { total, changed } = rows[0];
    if (changed > 0) {
      throw new Error(
        `${changed} requisitions in this batch aren't plain imports any more - not deleting anything`,
      );
    }
    await client.query(
      "DELETE FROM employee_requisitions WHERE import_batch_id = $1",
      [batchId],
    );
    await client.query(commit ? "COMMIT" : "ROLLBACK");
    return total;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
