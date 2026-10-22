import type { EmployeeStage } from "@/public/assets";

// What app/api/analytics/[type] returns for each dashboard. Client-safe.
// Every figure covers requisitions submitted in the filter's date range;
// "approved" means the requisition's final stage approved, "declined" that
// any stage declined, and "pending" everything still in its approval chain.

export type EmployeeAnalytics = {
  totals: {
    requisitions: number;
    headcountRequested: number;
    approvedRequisitions: number;
    approvedHeadcount: number;
    pendingRequisitions: number;
    pendingHeadcount: number;
    declinedRequisitions: number;
    // Calendar days from submission to the final decision (approval or
    // decline), averaged over decided requisitions; null when none are
    avgDaysToDecision: number | null;
    // Monthly salary range (KES) of the approved headcount: each position's
    // range times its headcount
    approvedSalaryMin: number;
    approvedSalaryMax: number;
    // Approved positions whose stored range couldn't be read
    unpricedApprovedPositions: number;
  };
  // One entry per calendar month of the range (YYYY-MM), by submission month
  monthly: {
    month: string;
    requestedHeadcount: number;
    approvedHeadcount: number;
  }[];
  byDepartment: {
    department: string;
    approvedHeadcount: number;
    pendingHeadcount: number;
  }[];
  // Approved headcount
  replacementOrNew: { kind: string; headcount: number }[];
  // Approved headcount, highest grade (by rank at submission) last
  byGrade: { grade: string; rank: number | null; headcount: number }[];
  // Pending requisitions by the stage they wait on, in approval order
  pipeline: { stage: EmployeeStage; requisitions: number; headcount: number }[];
  // Declined requisitions by the stage that declined them
  declines: { stage: EmployeeStage; requisitions: number }[];
  recentApproved: {
    positionId: string;
    positionTitle: string;
    department: string;
    grade: string;
    rank: number | null;
    headcount: number;
    replacementOrNew: string;
    salaryRange: string;
    // Nairobi calendar date of the final approval (YYYY-MM-DD)
    approvedOn: string;
  }[];
};

// The "department at a glance" panel on the Employee approval page: the
// requisition's department over the last 12 months, leaving out the
// requisition under review. Only what the panel shows, since that page is
// reached by token, without a session.
export type EmployeeDepartmentOverview = {
  // First submission date covered (YYYY-MM-DD, Nairobi)
  from: string;
  totals: EmployeeAnalytics["totals"];
  byGrade: EmployeeAnalytics["byGrade"];
  replacementOrNew: EmployeeAnalytics["replacementOrNew"];
  recentApproved: EmployeeAnalytics["recentApproved"];
};
