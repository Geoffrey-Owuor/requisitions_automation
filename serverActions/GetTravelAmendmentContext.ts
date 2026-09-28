"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { assignedHodNameSql } from "@/lib/hodAssignment";
import { TravelFormData } from "@/components/TravelRequisitionPage";
import { PUSHBACK_WINDOW_SQL } from "@/lib/travelPushback";
import {
  getTravelAmendmentBlocker,
  parseEngineeringJobs,
  TravelAmendmentValues,
  travelAmendmentsQuery,
} from "@/lib/travelAmendment";

export interface TravelAmendmentContext {
  requestId: string;
  expectedAmendmentCount: number;
  initialData: TravelFormData;
  history: TravelAmendmentValues[];
}

// Amendments are only allowed for the original submitter, until HR approves
// and on or before the departure date (lib/travelAmendment.ts). Returns null
// when the requisition doesn't exist, isn't owned by the current user, or is
// no longer within that window. The amendment route re-checks everything.
export async function getTravelAmendmentContext(
  requestId: string,
): Promise<TravelAmendmentContext | null> {
  const session = await getSession();
  if (!session) return null;

  const [headerResult, history] = await Promise.all([
    query(
      `SELECT submitter_email, travel_hr_approval_status, amendment_count,
       employee_name, employee_department, employee_designation,
       ${assignedHodNameSql("travel_hod_email", "travel_hod_approver")} AS travel_hod_approver,
       travel_destination,
       TO_CHAR(travel_departure_date, 'YYYY-MM-DD') AS departure_date,
       TO_CHAR(travel_return_date, 'YYYY-MM-DD') AS return_date,
       travel_category, travel_business_justification, travel_mode,
       travel_transport_cost, travel_other_costs, travel_per_diem,
       travel_cost_center, travel_within_budget, engineering_jobs,
       ${PUSHBACK_WINDOW_SQL} AS within_window
       FROM travel_requisitions WHERE request_id = $1`,
      [requestId],
    ),
    query<TravelAmendmentValues>(travelAmendmentsQuery, [requestId]),
  ]);

  if (headerResult.length === 0) return null;

  const header = headerResult[0];

  const isAmendable =
    header.submitter_email === session.email &&
    getTravelAmendmentBlocker({
      hrStatus: header.travel_hr_approval_status,
      withinWindow: header.within_window,
    }) === null;

  if (!isAmendable) return null;

  const engineeringJobs = parseEngineeringJobs(header.engineering_jobs).map(
    (job, index) => ({ id: `amend-${index}`, ...job }),
  );

  const initialData: TravelFormData = {
    employeeName: header.employee_name,
    department: header.employee_department,
    designation: header.employee_designation,
    hodApprover: header.travel_hod_approver,
    destination: header.travel_destination,
    departureDate: header.departure_date,
    returnDate: header.return_date,
    travelCategory: header.travel_category,
    justification: header.travel_business_justification,
    travelMode: header.travel_mode,
    transportCost: Number(header.travel_transport_cost),
    otherCost: Number(header.travel_other_costs),
    perDiem: Number(header.travel_per_diem),
    costCentre: header.travel_cost_center,
    withinBudget: header.travel_within_budget,
    engineeringJobs:
      engineeringJobs.length > 0
        ? engineeringJobs
        : [{ id: "init-1", title: "", amount: 0 }],
  };

  return {
    requestId,
    expectedAmendmentCount: header.amendment_count,
    initialData,
    history,
  };
}
