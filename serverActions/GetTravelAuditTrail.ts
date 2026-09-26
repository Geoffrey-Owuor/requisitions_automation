"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
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
 * modal. Limited to the people who can already see the requisition there:
 * its submitter, its stored HOD, travel HR and Directors.
 */
export async function getTravelAuditTrail(
  requestId: string,
): Promise<TravelAuditTrail> {
  const user = await getSession();
  if (!user) return EMPTY_TRAIL;

  try {
    const requisition = await query(
      `SELECT submitter_email, travel_hod_email FROM travel_requisitions WHERE request_id = $1`,
      [requestId],
    );
    if (requisition.length === 0) return EMPTY_TRAIL;

    const isSubmitter = requisition[0].submitter_email === user.email;
    const isHod = requisition[0].travel_hod_email === user.email;

    if (!isSubmitter && !isHod) {
      const roles = await getUserRoles(user.email);
      if (!roles.includes("hr-travel") && !roles.includes("director")) {
        return EMPTY_TRAIL;
      }
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
