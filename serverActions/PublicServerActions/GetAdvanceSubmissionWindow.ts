"use server";
import {
  AdvanceSubmissionWindow,
  getAdvanceSubmissionWindow,
} from "@/lib/salaryAdvanceWindow";

// Public: tells the advance form whether new requests are open and which
// repayment start dates are allowed. SubmitAdvanceForm re-checks both.
export async function GetAdvanceSubmissionWindow(): Promise<AdvanceSubmissionWindow> {
  return await getAdvanceSubmissionWindow();
}
