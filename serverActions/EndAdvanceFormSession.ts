"use server";
import { deleteAdvanceFormSession } from "@/lib/advanceVerificationSession";

export async function EndAdvanceFormSession() {
  await deleteAdvanceFormSession();
}
