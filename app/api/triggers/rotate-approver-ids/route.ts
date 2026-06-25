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

  const approvers = ["hod", "it", "hr", "director"];

  try {
    // get a pool client
    client = await pool.connect();

    // Begin a transaction
    await client.query("BEGIN");

    // Use a for...of loop so 'await' actually pauses the loop execution
    for (const approver of approvers) {
      // Dynamic table and column names (Safe here since 'approvers' is hardcoded/controlled)
      const updateQuery = `UPDATE ${approver}_array SET ${approver}_uuid = gen_random_uuid();`;

      // Execute the query using the transaction client
      await client.query(updateQuery);
    }

    // Commit the transaction if all updates succeed
    await client.query("COMMIT");

    return NextResponse.json(
      { success: true, message: "uuids rotated successfully" },
      { status: 200 },
    );
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error("[rotate-approver-ids-cron] Fatal error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
