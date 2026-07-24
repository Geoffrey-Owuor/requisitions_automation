"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export interface SalaryAdvanceCounts {
  total: number;
  pending: number;
  approved: number;
  declined: number;
  oneoff: number;
  continuous: number;
}

export async function GetSalaryAdvanceCounts(): Promise<SalaryAdvanceCounts> {
  const user = await getSession();
  if (!user)
    return {
      total: 0,
      pending: 0,
      approved: 0,
      declined: 0,
      oneoff: 0,
      continuous: 0,
    };
  // Use conditional aggregation to get all counts in a single efficient query
  const sqlQuery = `
   SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(approval_status) = 'pending') as pending,
        COUNT(*) FILTER (WHERE LOWER(approval_status) = 'approved') as approved,
        COUNT(*) FILTER (WHERE LOWER(approval_status) = 'declined') as declined,
        COUNT(*) FILTER (WHERE LOWER(request_type) = 'oneoff') as oneoff,
        COUNT(*) FILTER (WHERE LOWER(request_type) = 'continuous') as continuous
    FROM salary_advances;
  `;

  try {
    const result = await query(sqlQuery);
    const row = result[0];

    // Ensure we parse the string counts returned by Postgres into numbers
    return {
      total: Number(row.total) || 0,
      pending: Number(row.pending) || 0,
      approved: Number(row.approved) || 0,
      declined: Number(row.declined) || 0,
      oneoff: Number(row.oneoff) || 0,
      continuous: Number(row.continuous) || 0,
    };
  } catch (error) {
    console.error("Error while fetching salary advance counts:", error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      declined: 0,
      oneoff: 0,
      continuous: 0,
    };
  }
}
