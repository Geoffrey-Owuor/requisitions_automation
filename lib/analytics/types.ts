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

export type TravelStage = "hod" | "hr" | "director";

// Amounts are KES totals of the trips' travel_total_cost (or one of its
// parts), as currently stored — an amendment replaces the figures.
export type TravelAnalytics = {
  totals: {
    trips: number;
    requestedSpend: number;
    approvedTrips: number;
    approvedSpend: number;
    pendingTrips: number;
    pendingSpend: number;
    declinedTrips: number;
    // Average total cost of an approved trip; null when none are
    avgApprovedCost: number | null;
    // Approved trips the submitter marked as within budget
    approvedWithinBudget: number;
    // Calendar days from submission (or the latest amendment, which
    // restarts the chain) to the final decision; null when none are decided
    avgDaysToDecision: number | null;
    // HR decisions reversed, and trips amended at least once
    pushbacks: number;
    amendedTrips: number;
  };
  // Approved spend split into its parts
  approvedCostParts: { transport: number; perDiem: number; other: number };
  // One entry per calendar month of the range (YYYY-MM), by submission month
  monthly: { month: string; requestedSpend: number; approvedSpend: number }[];
  byDepartment: {
    department: string;
    approvedSpend: number;
    pendingSpend: number;
  }[];
  // Every trip in range, by approval tier
  byTier: {
    tier: string;
    trips: number;
    approvedTrips: number;
    approvedSpend: number;
  }[];
  // Approved trips
  byMode: { mode: string; trips: number }[];
  byCategory: { category: string; trips: number }[];
  topDestinations: { destination: string; trips: number; spend: number }[];
  // Pending trips by the stage they wait on, declined trips by the stage
  // that declined them, both in approval order
  pipeline: { stage: TravelStage; trips: number; spend: number }[];
  declines: { stage: TravelStage; trips: number }[];
  largestApproved: {
    requestId: string;
    employeeName: string;
    department: string;
    destination: string;
    // YYYY-MM-DD
    departureDate: string;
    tier: string;
    totalCost: number;
  }[];
};
