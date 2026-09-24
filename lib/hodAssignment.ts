// The HOD stage is never array-based: only the HOD selected at submission
// (stored on the requisition row) may act on it. Being a member of hod_array
// alone is not enough — otherwise any HOD holding their own approval token
// could act on another HOD's requisition and overwrite the stored HOD email.
export function isAssignedHod(
  approverEmail: string,
  storedHodEmail: string | null | undefined,
): boolean {
  if (!storedHodEmail) return false;
  return approverEmail.toLowerCase() === storedHodEmail.toLowerCase();
}

export const NOT_ASSIGNED_HOD_MESSAGE =
  "You are not the assigned HOD approver for this requisition, no action is required";
