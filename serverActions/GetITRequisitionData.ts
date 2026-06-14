"use server";
import { query } from "@/lib/db";

export interface ITRequisitionDataProps {
  dataFlag: "userData" | "hodPending" | "itPending" | "itAll";
  userEmail?: string;
  hodEmail?: string;
}

export const getITRequisitionData = async ({
  dataFlag,
  userEmail,
  hodEmail,
}: ITRequisitionDataProps) => {
  const baseParams = [];

  let baseQuery = `
    SELECT request_id, request_created_at, submitter_email, submitter_name,
    employee_name, employee_department, employee_staff_number, replacement_new,
    requirements, other_requirements, requisition_date, date_joining, hod_approver_name,
    hod_approver_status, hod_approver_comments, hod_approval_date, it_approver_name,
    it_approver_status, it_approver_comments, it_approval_date, completion_status
    FROM it_requisitions
    `;

  switch (dataFlag) {
    case "userData":
      baseQuery += ` WHERE submitter_email = $${baseParams.length + 1}`;
      baseParams.push(userEmail);
      break;
    case "hodPending":
      baseQuery += ` WHERE hod_approver_email = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`;
      baseParams.push(hodEmail, "pending");
      break;
    case "itPending":
      baseQuery += ` WHERE it_approver_status = $${baseParams.length + 1} AND hod_approver_status = $${baseParams.length + 2}`;
      baseParams.push("pending", "approved");
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
