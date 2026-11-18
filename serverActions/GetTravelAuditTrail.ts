"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canViewRequisition } from "@/lib/requisitionAccess";
import {
  TravelPushbackValues,
  travelPushbacksQuery,
} from "@/lib/travelPushback";
import {
  TravelAmendmentValues,
  travelAmendmentsQuery,
} from "@/lib/travelAmendment";

export interface TravelAuditTrail {
  pushbacks: TravelPushbackValues[];
  amendments: TravelAmendmentValues[];
}

const EMPTY_TRAIL: TravelAuditTrail = { pushbacks: [], amendments: [] };

/**
 * HR push-back and amendment history for the dashboard's travel details
 * modal, and the analytics Records view's. Limited to whoever may view the
 * requisition (lib/requisitionAccess.ts).
 */
export async function getTravelAuditTrail(
  requestId: string,
): Promise<TravelAuditTrail> {
  const user = await getSession();
  if (!user) return EMPTY_TRAIL;

  try {
    // The submitter, its HOD, travel HR and Directors it has reached,
    // Finance and analytics-travel (lib/requisitionAccess.ts)
    if (!(await canViewRequisition("travel", requestId, user.email))) {
      return EMPTY_TRAIL;
    }

    const [pushbacks, amendments] = await Promise.all([
      query<TravelPushbackValues>(travelPushbacksQuery, [requestId]),
      query<TravelAmendmentValues>(travelAmendmentsQuery, [requestId]),
    ]);

    return { pushbacks, amendments };
  } catch (error) {
    console.error("Error while trying to fetch the travel audit trail:", error);
    return EMPTY_TRAIL;
  }
}
