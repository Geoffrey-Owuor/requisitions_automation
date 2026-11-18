"use server";
import { getSession } from "@/lib/session";
import { canViewRequisition } from "@/lib/requisitionAccess";
import {
  getCasualEmailData,
  CasualEmailDataValues,
} from "@/services/CasualEmailSender";

// Section-level headcount/PDF detail for the dashboard modal — reuses the
// same cached query CasualEmailSender/casualpdf already rely on, so the
// requested-vs-HR-approved headcount reconciliation isn't re-derived a
// third time.
export async function getCasualRequisitionDetails(
  requestId: string,
): Promise<CasualEmailDataValues | null> {
  const session = await getSession();
  if (!session) return null;
  // Checked first: requestId comes from the browser (lib/requisitionAccess.ts)
  if (!(await canViewRequisition("casual", requestId, session.email))) {
    return null;
  }

  const data = await getCasualEmailData(requestId);
  if (!data.emailaddress) return null; // no such requisition

  return data;
}
