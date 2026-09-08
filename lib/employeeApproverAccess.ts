import { query } from "@/lib/db";

interface EmployeeChainStatus {
  hodEmail: string | null;
  hodApprovalStatus: string;
  retailDirectorApprovalStatus: string;
  directorApprovalStatus: string;
}

// Whether `email` is authorized to view a given employee requisition's
// details/attachments as an approver — the assigned HOD, or a member of the
// director/retail-director/HR(employee-scoped) array once this requisition's
// chain has actually reached that stage. Mirrors exactly which rows each
// approver's dashboard queue shows them, rather than exposing every
// requisition to every array member regardless of whether it's reached them.
export async function isEmployeeRequisitionApprover(
  email: string,
  chain: EmployeeChainStatus,
): Promise<boolean> {
  if (email === chain.hodEmail) return true;
  if (chain.hodApprovalStatus !== "approved") return false;

  const [retailDirector, director, hr] = await Promise.all([
    query(
      "SELECT 1 FROM retail_director_array WHERE retail_director_email = $1",
      [email],
    ),
    query("SELECT 1 FROM director_array WHERE director_email = $1", [email]),
    query(
      "SELECT 1 FROM hr_array WHERE hr_email = $1 AND 'employee' = ANY(hr_forms)",
      [email],
    ),
  ]);

  if (retailDirector.length > 0) return true;

  const retailDirectorDone =
    chain.retailDirectorApprovalStatus === "approved" ||
    chain.retailDirectorApprovalStatus === "N/A";
  if (!retailDirectorDone) return false;

  if (director.length > 0) return true;
  return chain.directorApprovalStatus === "approved" && hr.length > 0;
}
