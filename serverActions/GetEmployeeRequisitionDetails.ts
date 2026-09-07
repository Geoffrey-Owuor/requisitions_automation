"use server";
import { getSession } from "@/lib/session";
import { isEmployeeRequisitionApprover } from "@/lib/employeeApproverAccess";
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

  const data = await getEmployeeEmailData(requestId);
  if (!data.emailaddress) return null; // no such requisition

  const isSubmitter = data.emailaddress === session.email;
  const isApprover =
    !isSubmitter &&
    (await isEmployeeRequisitionApprover(session.email, {
      hodEmail: data.hodemail,
      hodApprovalStatus: data.hodapprovalstatus,
      retailDirectorApprovalStatus: data.retaildirectorapprovalstatus,
      directorApprovalStatus: data.directorapprovalstatus,
    }));

  if (!isSubmitter && !isApprover) return null;

  return data;
}
