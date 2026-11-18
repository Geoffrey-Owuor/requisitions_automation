"use server";
import { getSession } from "@/lib/session";
import { canViewRequisition } from "@/lib/requisitionAccess";
import {
  getEmployeeEmailData,
  EmployeeEmailDataValues,
} from "@/services/EmployeeEmailSender";

// Position/attachment-level detail for the dashboard modal — reuses the
// same cached query EmployeeEmailSender/employeeview already rely on.
export async function getEmployeeRequisitionDetails(
  requestId: string,
): Promise<EmployeeEmailDataValues | null> {
  const session = await getSession();
  if (!session) return null;
  // Checked first: requestId comes from the browser (lib/requisitionAccess.ts)
  if (!(await canViewRequisition("employee", requestId, session.email))) {
    return null;
  }

  const data = await getEmployeeEmailData(requestId);
  if (!data.emailaddress) return null; // no such requisition

  return data;
}
