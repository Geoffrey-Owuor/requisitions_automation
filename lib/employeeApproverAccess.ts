import { query } from "@/lib/db";
import { isHodViewer } from "@/lib/hodAssignment";

interface EmployeeChainStatus {
  // The HOD selected at submission, and whoever acted on the HOD stage
  // (the assigned HOD or one of their alternates; null while pending)
  assignedHodEmail: string | null;
  hodActionedByEmail: string | null;
  hodApprovalStatus: string;
  retailDirectorApprovalStatus: string;
  directorApprovalStatus: string;
}

// Whether `email` is authorized to view a given employee requisition's
// details/attachments as an approver — the assigned HOD, whoever acted on the
// HOD stage, an alternate of the assigned HOD while it's pending, or a member of the
// director/retail-director/HR(employee-scoped) array once this requisition's
// chain has actually reached that stage. Mirrors exactly which rows each
// approver's dashboard queue shows them, rather than exposing every
// requisition to every array member regardless of whether it's reached them.
export async function isEmployeeRequisitionApprover(
  email: string,
  chain: EmployeeChainStatus,
): Promise<boolean> {
  if (
    await isHodViewer(email, {
      assignedHodEmail: chain.assignedHodEmail,
      actionedByEmail: chain.hodActionedByEmail,
      hodStatus: chain.hodApprovalStatus,
    })
  )
    return true;
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

  // Retail Director only applies to retail requests ('N/A' otherwise).
  if (
    retailDirector.length > 0 &&
    chain.retailDirectorApprovalStatus !== "N/A"
  ) {
    return true;
  }

  const retailDirectorDone =
    chain.retailDirectorApprovalStatus === "approved" ||
    chain.retailDirectorApprovalStatus === "N/A";
  if (!retailDirectorDone) return false;

  if (director.length > 0) return true;
  return chain.directorApprovalStatus === "approved" && hr.length > 0;
}
