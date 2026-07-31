"use server";
import {
  getAdvanceFormSession as readAdvanceFormSession,
  AdvanceVerificationPayload,
} from "@/lib/advanceVerificationSession";

export async function GetAdvanceFormSession(): Promise<AdvanceVerificationPayload | null> {
  return await readAdvanceFormSession();
}
