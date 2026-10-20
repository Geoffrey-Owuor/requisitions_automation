"use server";
import { query } from "@/lib/db";
import {
  cleanConfigName,
  ConfigInputError,
  type ConfigChangeRow,
  getConfigAdminSession,
  isConfigId,
  loadConfigChanges,
  recordConfigChange,
  runConfigChange,
} from "@/lib/configAdminAccess";

// The Settings page's Employee tab: job grades (job_grades, migration 027),
// offered in rank order. Grades are added, re-ranked and (de)activated,
// never renamed or deleted - positions store the grade's name and its rank
// at submission, so re-ranking never renumbers an existing requisition.

const TAG = "GetJobGrades";

export interface EmployeeConfigAdminData {
  grades: { id: number; name: string; rank: number; isActive: boolean }[];
  changes: ConfigChangeRow[];
}

export async function getEmployeeConfigAdminData(): Promise<EmployeeConfigAdminData | null> {
  if (!(await getConfigAdminSession())) return null;

  const [grades, changes] = await Promise.all([
    query<EmployeeConfigAdminData["grades"][number]>(
      `SELECT id, grade_name AS name, grade_rank AS rank, is_active AS "isActive"
       FROM job_grades ORDER BY grade_rank`,
    ),
    loadConfigChanges(["job_grades"]),
  ]);
  return { grades, changes };
}

// New grades go to the top of the ranking
export async function addJobGrade(name: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    const gradeName = cleanConfigName(name, "job grade");

    await client.query(`LOCK TABLE job_grades IN SHARE ROW EXCLUSIVE MODE`);
    const { rows } = await client.query(
      `INSERT INTO job_grades (grade_name, grade_rank)
       SELECT $1, COALESCE(MAX(grade_rank), 0) + 1 FROM job_grades
       ON CONFLICT (grade_name) DO NOTHING
       RETURNING id, grade_name, grade_rank, is_active`,
      [gradeName],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(`"${gradeName}" already exists`);
    }

    const summary = `Added job grade "${gradeName}" (Grade ${rows[0].grade_rank})`;
    await recordConfigChange(client, actor, {
      table: "job_grades",
      key: rows[0].id,
      action: "create",
      summary,
      after: rows[0],
    });
    return summary;
  });
}

export async function setJobGradeActive(id: unknown, isActive: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    if (!isConfigId(id) || typeof isActive !== "boolean") {
      throw new ConfigInputError("Choose a job grade");
    }

    const { rows } = await client.query(
      `UPDATE job_grades SET is_active = $2
       WHERE id = $1 AND is_active <> $2 RETURNING grade_name AS name`,
      [id, isActive],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        `That grade was already ${isActive ? "active" : "inactive"} - reload to see the latest`,
      );
    }

    const summary = `${isActive ? "Reactivated" : "Deactivated"} job grade "${rows[0].name}"`;
    await recordConfigChange(client, actor, {
      table: "job_grades",
      key: id,
      action: "update",
      summary,
      before: { is_active: !isActive },
      after: { is_active: isActive },
    });
    return summary;
  });
}

// Swaps a grade's rank with the next grade up or down
export async function moveJobGrade(id: unknown, direction: unknown) {
  return runConfigChange(TAG, async (client, actor) => {
    if (!isConfigId(id) || (direction !== "up" && direction !== "down")) {
      throw new ConfigInputError("Choose a job grade");
    }

    await client.query(`LOCK TABLE job_grades IN SHARE ROW EXCLUSIVE MODE`);
    const { rows } = await client.query<{
      id: number;
      name: string;
      rank: number;
    }>(
      `SELECT g.id, g.grade_name AS name, g.grade_rank AS rank
       FROM job_grades g WHERE g.id = $1
       UNION ALL
       SELECT * FROM (
         SELECT n.id, n.grade_name, n.grade_rank FROM job_grades n
         WHERE n.grade_rank ${direction === "up" ? ">" : "<"}
           (SELECT grade_rank FROM job_grades WHERE id = $1)
         ORDER BY n.grade_rank ${direction === "up" ? "ASC" : "DESC"} LIMIT 1
       ) neighbour`,
      [id],
    );
    if (rows.length === 0) {
      throw new ConfigInputError(
        "That grade no longer exists - reload to see the latest",
      );
    }
    if (rows.length === 1) {
      throw new ConfigInputError(
        `"${rows[0].name}" is already the ${direction === "up" ? "highest" : "lowest"} grade`,
      );
    }
    const [grade, neighbour] = rows;

    // grade_rank is unique, so park one rank above every other first
    await client.query(
      `UPDATE job_grades SET grade_rank = (SELECT MAX(grade_rank) + 1 FROM job_grades)
       WHERE id = $1`,
      [grade.id],
    );
    await client.query(`UPDATE job_grades SET grade_rank = $2 WHERE id = $1`, [
      neighbour.id,
      grade.rank,
    ]);
    await client.query(`UPDATE job_grades SET grade_rank = $2 WHERE id = $1`, [
      grade.id,
      neighbour.rank,
    ]);

    const summary = `Moved job grade "${grade.name}" to Grade ${neighbour.rank}, ${direction === "up" ? "above" : "below"} "${neighbour.name}"`;
    await recordConfigChange(client, actor, {
      table: "job_grades",
      key: grade.id,
      action: "update",
      summary,
      before: { [grade.name]: grade.rank, [neighbour.name]: neighbour.rank },
      after: { [grade.name]: neighbour.rank, [neighbour.name]: grade.rank },
    });
    return `Moved "${grade.name}" ${direction}`;
  });
}
