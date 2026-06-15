"use server";
import { query } from "@/lib/db";

export interface TravelRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "hrPending" | "directorPending";
  userEmail?: string;
  hodEmail?: string;
}

export const getTravelRequisitionData = async ({
  dataFlag,
  userEmail,
  hodEmail,
}: TravelRequisitionDataProps) => {
  const baseParams = [];

  let baseQuery = `
    SELECT 
        request_id, request_created_at,
        employee_name, travel_destination, travel_departure_date, 
        travel_return_date, travel_business_justification, 
        travel_mode, travel_total_cost, 
        travel_cost_center,
        travel_hod_approval_status, travel_hr_approval_status, travel_director_approval_status
        FROM travel_requisitions
    `;

  switch (dataFlag) {
    case "userData":
      baseQuery += ` WHERE submitter_email = $${baseParams.length + 1}`;
      baseParams.push(userEmail);
      break;
    case "hodPending":
      baseQuery += ` WHERE travel_hod_email = $${baseParams.length + 1} AND 
                     travel_hod_approval_status = $${baseParams.length + 2}`;
      baseParams.push(hodEmail, "pending");
      break;
    case "hrPending":
      baseQuery += ` WHERE travel_hod_approval_status = $${baseParams.length + 1} AND
                     travel_hr_approval_status = $${baseParams.length + 2}`;
      baseParams.push("approved", "pending");
      break;
    case "directorPending":
      baseQuery += ` WHERE travel_hod_approval_status = $${baseParams.length + 1} AND
                     travel_hr_approval_status = $${baseParams.length + 2} AND
                     travel_director_approval_status = $${baseParams.length + 3}`;
      baseParams.push("approved", "approved", "pending");
      break;
  }

  // Final base query
  baseQuery += ` ORDER BY request_created_at DESC`;

  try {
    const result = await query(baseQuery, baseParams);
    return result;
  } catch (error) {
    console.error(
      "Error while trying to fetch travel requisition data:",
      error,
    );
    return [];
  }
};
