"use server";
import { query } from "@/lib/db";

export const getITRequisitionData = async (email?: string) => {
  const baseParams = [];

  let baseQuery = `
    SELECT request_id, request_created_at, submitter_email, submitter_name,
    employee_name, employee_department, employee_staff_number, replacement_new,
    requirements, other_requirements, requisition_date, date_joining, hod_approver_name,
    hod_approver_status, hod_approver_comments, hod_approval_date, it_approver_name,
    it_approver_status, it_approver_comments, it_approval_date, completion_status
    FROM it_requisitions
    `;

  if (email) {
    baseQuery += ` WHERE submitter_email = $1`;
    baseParams.push(email);
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
