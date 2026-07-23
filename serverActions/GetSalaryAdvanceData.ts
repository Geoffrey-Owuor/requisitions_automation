"use server";
import { query } from "@/lib/db";

export interface SalaryAdvanceData {
  request_id: string;
  request_created_at: string;
  staff_number: string;
  staff_name: string;
  staff_email: string;
  staff_department: string;
  staff_location: string;
  request_amount: number;
  no_of_installments: string;
  repayment_start_date: string;
  request_type: string;
  approval_status: string;
  approver_comments: string;
}

export async function GetSalaryAdvanceData(): Promise<
  SalaryAdvanceData[] | []
> {
  const baseQuery = `
    SELECT
    request_id, request_created_at, staff_number, staff_name, staff_email, staff_department, 
    staff_location, request_amount, no_of_installments, repayment_start_date, 
    request_type, approval_status, approver_comments
    FROM salary_advances
    ORDER BY request_created_at DESC LIMIT 500
    `;

  try {
    const result = await query<SalaryAdvanceData>(baseQuery);

    return result;
  } catch (error) {
    console.error("Error while trying to fetch salary advance data:", error);
    return [];
  }
}
