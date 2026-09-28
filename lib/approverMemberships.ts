import { HrForm } from "@/public/assets";

// Array-based approval stages (Security, IT, Director, Retail Director, HR)
// have no "assigned to me" column — every member of the stage's array table
// sees the same pending rows once the prior stage has approved. This mirrors
// exactly who each stage's fan-out email goes to (lib/loadAppDataV2.ts), so
// dashboard visibility can't drift from who is actually notified.
export interface ApproverMemberships {
  // In hod_array at all - an assigned-HOD candidate or an alternate HOD.
  // The HOD stage itself is not array-based (only the assigned HOD and
  // their alternates can act - lib/hodAssignment.ts); this only decides
  // whether the HOD pending/history tables render, and those are scoped
  // server-side to the viewer's email.
  isHodApprover: boolean;
  isSecurityApprover: boolean;
  isITApprover: boolean;
  isDirector: boolean;
  isRetailDirector: boolean;
  // Forms (casual/employee/travel) this HR approver is permitted to act on
  // (hr_array.hr_forms) — empty if not an HR approver at all.
  hrForms: HrForm[];
}

export const EMPTY_MEMBERSHIPS: ApproverMemberships = {
  isHodApprover: false,
  isSecurityApprover: false,
  isITApprover: false,
  isDirector: false,
  isRetailDirector: false,
  hrForms: [],
};
