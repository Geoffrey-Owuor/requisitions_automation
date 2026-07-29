"use server";
import { query } from "@/lib/db";

export async function GetSalaryAdvanceLock(): Promise<boolean> {
  try {
    const result = await query(
      "SELECT lock_advance_form FROM salary_advance_metadata ORDER BY id LIMIT 1",
    );
    const lockAdvanceForm = result[0]?.lock_advance_form === true;

    return lockAdvanceForm;
  } catch (error) {
    console.log("Failed to fetch lock advance form boolean:", error);
    return true;
  }
}
