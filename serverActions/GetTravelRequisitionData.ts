"use server";
import { query } from "@/lib/db";

export const getTravelRequisitionData = async (email?: string) => {
  if (!email) return [];

  const fetchQuery = `
    SELECT 
        request_id, request_created_at,
        employee_name, travel_destination, travel_departure_date, 
        travel_return_date, travel_business_justification, 
        travel_mode, travel_total_cost, 
        travel_cost_center,
        travel_hod_approval_status, travel_hr_approval_status, travel_director_approval_status
        FROM travel_requisitions
        WHERE submitter_email = $1 ORDER BY request_created_at DESC
    `;

  try {
    const result = await query(fetchQuery, [email]);
    return result;
  } catch (error) {
    console.error(
      "Error while trying to fetch travel requisition data:",
      error,
    );
    return [];
  }
};
