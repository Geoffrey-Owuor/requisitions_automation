"use server";
import { query } from "@/lib/db";

export interface ReturnedStaffDetails {
  staff_name: string;
  staff_email: string;
  staff_department: string;
  staff_location: string;
}
export async function FetchStaffDetails(
  staffNumber: string,
): Promise<ReturnedStaffDetails | null> {
  if (!staffNumber) {
    return null;
  }

  try {
    const result = await query<ReturnedStaffDetails>(
      `SELECT staff_name, staff_email, 
       staff_department, staff_location
       FROM company_staff_data 
       WHERE staff_number = $1 
       LIMIT 1`,
      [staffNumber],
    );

    if (result.length === 0) {
      return null;
    }

    const staff = result[0];
    return staff;
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return null;
  }
}
