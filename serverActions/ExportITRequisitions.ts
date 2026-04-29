"use server";
import { query } from "@/lib/db";
import { Workbook } from "exceljs";

export const ExportItRequisitions = async () => {
  const baseQuery = `
  SELECT
  request_id, request_created_at, submitter_email, submitter_name,
  employee_department, employee_staff_number, replacement_new,
  requirements, other_requirements, requisition_date, date_joining,
  hod_approver_name, hod_approver_email, hod_approver_status,
  hod_approver_comments, hod_approval_date, it_approver_name, it_approver_email,
  it_approver_status, it_approver_comments, it_approval_date, completion_status
  FROM it_requisitions ORDER BY request_created_at DESC
  `;

  try {
  } catch (error) {}
};
