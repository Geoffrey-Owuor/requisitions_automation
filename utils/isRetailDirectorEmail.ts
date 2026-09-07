import { Pool, PoolClient } from "pg";

/**
 * Checks whether an email belongs to someone in the retail_director_array
 * table. Used to detect when a selected HOD is also a Retail Director, so
 * the Retail Director approval stage can be auto-approved rather than
 * requiring the same person to approve twice under two different roles.
 */
export async function isRetailDirectorEmail(
  executor: Pool | PoolClient,
  email: string,
): Promise<boolean> {
  const { rows } = await executor.query(
    `SELECT 1 FROM retail_director_array WHERE retail_director_email = $1 LIMIT 1`,
    [email],
  );
  return rows.length > 0;
}
