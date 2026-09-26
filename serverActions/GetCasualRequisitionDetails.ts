"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isHodViewer } from "@/lib/hodAssignment";
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

  const data = await getCasualEmailData(requestId);
  if (!data.emailaddress) return null; // no such requisition

  const isSubmitter = data.emailaddress === session.email;
  // Assigned HOD, whoever acted on the HOD stage, or an alternate of the
  // assigned HOD while it's still pending
  const isHod =
    !isSubmitter &&
    (await isHodViewer(session.email, {
      assignedHodEmail: data.assignedhodemail,
      actionedByEmail: data.hodemail,
      hodStatus: data.hodapprovalstatus,
    }));

  let isPermittedHr = false;
  if (!isSubmitter && !isHod) {
    const hr = await query(
      "SELECT 1 FROM hr_array WHERE hr_email = $1 AND 'casual' = ANY(hr_forms) LIMIT 1",
      [session.email],
    );
    isPermittedHr = hr.length > 0;
  }

  if (!isSubmitter && !isHod && !isPermittedHr) return null;

  return data;
}
