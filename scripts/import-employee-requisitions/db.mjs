import pg from "pg";

// Connects with the same DATABASE_* variables as lib/db.ts, loaded with
// node --env-file (see README.md).
export async function connect() {
  if (!process.env.DATABASE_HOST || !process.env.DATABASE_NAME) {
    throw new Error(
      "DATABASE_HOST/DATABASE_NAME aren't set - run with node --env-file=<the app's env file>",
    );
  }
  const client = new pg.Client({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  return client;
}

// Every department and job grade, inactive ones included: past requisitions
// may use names that have since been deactivated.
export async function loadLookups(client) {
  const [departments, grades] = await Promise.all([
    client.query(
      `SELECT department_name AS name, is_active AS "isActive",
       requires_retail_director AS "requiresRetailDirector"
       FROM base_departments ORDER BY department_name`,
    ),
    client.query(
      `SELECT grade_name AS name, grade_rank AS rank, is_active AS "isActive"
       FROM job_grades ORDER BY grade_rank`,
    ),
  ]);
  return { departments: departments.rows, grades: grades.rows };
}
