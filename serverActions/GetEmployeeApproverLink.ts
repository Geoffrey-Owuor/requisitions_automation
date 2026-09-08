"use server";
import { query } from "@/lib/db";
import { EmployeeStageLevels } from "@/components/Dashboard/EmployeeRequisitionsDashboard/EmployeeDetailsModal";
import { getSession } from "@/lib/session";

interface EmployeeApproverLinkProps {
  email: string;
  uuid: string;
  stage: EmployeeStageLevels;
}

export async function getEmployeeApproverLink({
  email,
  uuid,
  stage,
}: EmployeeApproverLinkProps): Promise<string> {
  const user = await getSession();
  if (!user) return "#";

  const baseQuery = `SELECT ${stage}_uuid AS token
                     FROM ${stage}_array WHERE ${stage}_email = $1 LIMIT 1`;

  try {
    const result = await query(baseQuery, [email]);

    const token = result[0].token;

    // Construct the link
    const approvalLink = `/employeeapproval/${uuid}?token=${token}&stage=${stage}`;

    return approvalLink;
  } catch (error) {
    console.error("Error while trying to get an approver token:", error);
    return "#";
  }
}
