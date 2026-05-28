import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  let client: PoolClient | undefined;

  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  // 1. Security Check: Ensure only your script can trigger this
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Our base update query
    const updateQuery = `
        UPDATE it_requisitions
        SET completion_status = $1,
        date_completed = CURRENT_TIMESTAMP
        WHERE completion_status = $2
        AND it_approver_status = $3
        RETURNING request_id, submitter_email, date_completed
        `;

    // get a pool client
    client = await pool.connect();

    // Begin a transaction
    await client.query("BEGIN");

    // Lock rows for update
    await client.query(
      `SELECT request_id FROM it_requisitions
        WHERE completion_status = $1 AND it_approver_status = $2 FOR UPDATE`,
      ["incomplete", "accepted"],
    );

    // Running the update query
    const { rows } = await client.query(updateQuery, [
      "completed",
      "incomplete",
      "accepted",
    ]);

    // Commit the transaction
    await client.query("COMMIT");

    // Return the json response
    return NextResponse.json({ success: true, rows }, { status: 200 });
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error("[autocomplete-cron] Fatal error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
